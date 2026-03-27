import json

from google import genai
from google.genai import types

from src.backend.modules.llm.base import BaseLLM, Evaluation, GeneratedQuestion, SessionSummary
from src.backend.modules.llm.prompts import (
    ANSWER_EVALUATION_USER,
    FOLLOW_UP_INSTRUCTION,
    NO_FOLLOW_UP_INSTRUCTION,
    QUESTION_GENERATION_USER,
    SESSION_SUMMARY_USER,
    SYSTEM_EVALUATOR,
    SYSTEM_INTERVIEWER,
    SYSTEM_SUMMARY,
)

QUESTION_SCHEMA = types.Schema(
    type="OBJECT",
    properties={
        "question": types.Schema(type="STRING"),
        "suggested_answer": types.Schema(type="STRING"),
    },
    required=["question", "suggested_answer"],
)

EVALUATION_SCHEMA = types.Schema(
    type="OBJECT",
    properties={
        "score": types.Schema(type="INTEGER"),
        "feedback": types.Schema(type="STRING"),
        "improved_answer": types.Schema(type="STRING", nullable=True),
    },
    required=["score", "feedback", "improved_answer"],
)


class GeminiLLM(BaseLLM):
    def __init__(self, api_key: str) -> None:
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3-flash-preview"

    async def generate_question(
        self,
        context: str,
        position: int,
        previous_qa: list[dict],
        is_follow_up: bool,
    ) -> GeneratedQuestion:
        user_prompt = QUESTION_GENERATION_USER.format(
            context=context,
            position=position,
            follow_up_instruction=FOLLOW_UP_INSTRUCTION if is_follow_up else NO_FOLLOW_UP_INSTRUCTION,
            previous_qa=self._format_qa(previous_qa),
        )
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INTERVIEWER,
                response_mime_type="application/json",
                response_schema=QUESTION_SCHEMA,
            ),
        )
        data = json.loads(response.text)
        return GeneratedQuestion(
            question_text=data["question"],
            suggested_answer=data["suggested_answer"],
        )

    async def evaluate_answer(
        self,
        context: str,
        question_text: str,
        transcription: str,
    ) -> Evaluation:
        user_prompt = ANSWER_EVALUATION_USER.format(
            context=context,
            question_text=question_text,
            transcription=transcription,
        )
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_EVALUATOR,
                response_mime_type="application/json",
                response_schema=EVALUATION_SCHEMA,
            ),
        )
        data = json.loads(response.text)
        return Evaluation(
            score=int(data["score"]),
            feedback=data["feedback"],
            improved_answer=data.get("improved_answer"),
        )

    async def generate_summary(
        self,
        context: str,
        questions_and_scores: list[dict],
    ) -> SessionSummary:
        user_prompt = SESSION_SUMMARY_USER.format(
            context=context,
            questions_and_scores=json.dumps(questions_and_scores, indent=2),
        )
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_SUMMARY,
            ),
        )

        scores = [q["score"] for q in questions_and_scores if q.get("score")]
        avg = sum(scores) / len(scores) if scores else 0.0

        return SessionSummary(
            average_score=round(avg, 1),
            general_feedback=response.text.strip(),
        )

    @staticmethod
    def _format_qa(previous_qa: list[dict]) -> str:
        if not previous_qa:
            return "None (this is the first question)"
        lines = []
        for qa in previous_qa:
            lines.append(f"Q{qa['position']}: {qa['question']}")
            lines.append(f"A{qa['position']}: {qa['answer']}")
        return "\n".join(lines)
