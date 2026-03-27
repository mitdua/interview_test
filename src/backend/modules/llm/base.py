from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class GeneratedQuestion:
    question_text: str
    suggested_answer: str


@dataclass
class Evaluation:
    score: int
    feedback: str
    improved_answer: str | None


@dataclass
class SessionSummary:
    average_score: float
    general_feedback: str


class BaseLLM(ABC):
    @abstractmethod
    async def generate_question(
        self,
        context: str,
        position: int,
        previous_qa: list[dict],
        is_follow_up: bool,
    ) -> GeneratedQuestion:
        """Generate an interview question based on context and history."""

    @abstractmethod
    async def evaluate_answer(
        self,
        context: str,
        question_text: str,
        transcription: str,
    ) -> Evaluation:
        """Evaluate a candidate's answer and provide feedback."""

    @abstractmethod
    async def generate_summary(
        self,
        context: str,
        questions_and_scores: list[dict],
    ) -> SessionSummary:
        """Generate a summary for the entire interview session."""
