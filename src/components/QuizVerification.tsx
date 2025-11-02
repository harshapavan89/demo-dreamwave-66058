import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
}

interface QuizVerificationProps {
  questions: QuizQuestion[];
  onComplete: (score: number, passed: boolean) => void;
}

export const QuizVerification = ({ questions, onComplete }: QuizVerificationProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Calculate score
      const correct = newAnswers.filter((ans, idx) => ans === questions[idx].correct_answer).length;
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= 70;
      
      setShowResults(true);
      onComplete(score, passed);
    }
  };

  if (showResults) {
    const correct = answers.filter((ans, idx) => ans === questions[idx].correct_answer).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          {passed ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h3 className="text-2xl font-bold">Quiz Passed!</h3>
              <p className="text-muted-foreground">
                You scored {score}%. Task completed!
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <h3 className="text-2xl font-bold">Quiz Failed</h3>
              <p className="text-muted-foreground">
                You scored {score}%. Need 70% to pass. Try again!
              </p>
            </>
          )}
        </div>
      </Card>
    );
  }

  const question = questions[currentQuestion];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <h3 className="text-lg font-semibold">{question.question}</h3>
        </div>

        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Button 
          onClick={handleNext} 
          disabled={selectedAnswer === null}
          className="w-full"
        >
          {currentQuestion < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
        </Button>
      </div>
    </Card>
  );
};