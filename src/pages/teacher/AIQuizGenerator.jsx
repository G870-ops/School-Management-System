import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Sidebar from '../../components/Sidebar';
import ChatRoom from '../../components/ChatRoom';
import { Brain, LoaderCircle, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

const AIQuizGenerator = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tracks selected answers for each question index
  const [userAnswers, setUserAnswers] = useState({});

  // Helper function to check if option matches correct answer
  const isCorrectAnswer = (question, option, optIdx) => {
    const correctAnswer = question?.correctAnswer ?? question?.answer;
    if (correctAnswer === undefined || correctAnswer === null) return false;

    const answerStr = String(correctAnswer).trim().toLowerCase();
    const optionStr = String(option).trim().toLowerCase();

    // 1. Exact or String Match (e.g., "1757" vs 1757)
    if (optionStr === answerStr) return true;

    // 2. Index-Based Match (e.g., answer is 0 or "0")
    if (String(optIdx) === answerStr) return true;

    // 3. Option Key Match (e.g., answer is "A", "B", "C", "D")
    const optionLetter = String.fromCharCode(65 + optIdx).toLowerCase(); // 0 -> 'a', 1 -> 'b'
    if (answerStr === optionLetter) return true;

    return false;
  };

  const handleQuestionCountChange = (event) => {
    const rawVal = parseInt(event.target.value, 10);
    if (isNaN(rawVal)) {
      setQuestionCount('');
      return;
    }
    const clampedVal = Math.min(Math.max(rawVal, 1), 50);
    setQuestionCount(clampedVal);
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError('');
    setUserAnswers({});

    const validCount = Number(questionCount) || 5;
    setLoading(true);

    try {
      const response = await axiosInstance.post('/ai/generate-quiz', {
        subject: subject.trim(),
        topic: topic.trim(),
        questionCount: validCount,
      }, { timeout: 120000 });
      setQuiz(response.data.quiz || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || requestError.message || 'Unable to generate the quiz. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex, selectedOption) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: selectedOption,
    }));
  };

  // Calculate score stats
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = quiz.reduce((acc, q, idx) => {
    const selectedOpt = userAnswers[idx];
    if (selectedOpt !== undefined) {
      const optIdx = q.options?.indexOf(selectedOpt);
      if (isCorrectAnswer(q, selectedOpt, optIdx)) {
        return acc + 1;
      }
    }
    return acc;
  }, 0);
  const wrongCount = answeredCount - correctCount;

  const handleResetQuiz = () => {
    setUserAnswers({});
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <Brain className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">AI Quiz Generator</h1>
              <p className="text-sm text-slate-500">Create quiz questions for your class.</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
              <input
                required
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Topic"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={handleQuestionCountChange}
                placeholder="Questions (1-50)"
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          </form>

          {/* Quiz Score Summary Box */}
          {quiz.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Questions</span>
                  <p className="text-xl font-bold text-slate-800">{quiz.length}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Correct Answers</span>
                  <p className="text-xl font-bold text-emerald-600">{correctCount}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Wrong Answers</span>
                  <p className="text-xl font-bold text-rose-600">{wrongCount}</p>
                </div>
              </div>

              {answeredCount > 0 && (
                <button
                  onClick={handleResetQuiz}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <RotateCcw className="h-4 w-4" /> Reset Answers
                </button>
              )}
            </div>
          )}

          {/* Quiz Questions List */}
          {quiz.length > 0 && (
            <section className="mt-6 space-y-4">
              {quiz.map((question, index) => {
                const selectedOption = userAnswers[index];
                const isAnswered = selectedOption !== undefined;

                return (
                  <article
                    key={question.id || `q-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h2 className="font-semibold text-slate-800">
                      {index + 1}. {question.question}
                    </h2>

                    {Array.isArray(question.options) && (
                      <div className="mt-4 space-y-2">
                        {question.options.map((option, optIdx) => {
                          const isSelected = selectedOption === option;
                          const isCorrect = isCorrectAnswer(question, option, optIdx);

                          let optionStyle =
                            'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';

                          if (isAnswered) {
                            if (isCorrect) {
                              optionStyle =
                                'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium';
                            } else if (isSelected && !isCorrect) {
                              optionStyle =
                                'border-rose-500 bg-rose-50 text-rose-900 font-medium';
                            } else {
                              optionStyle =
                                'border-slate-200 bg-white text-slate-400 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={`opt-${index}-${optIdx}`}
                              type="button"
                              onClick={() => handleOptionSelect(index, option)}
                              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${optionStyle}`}
                            >
                              <span>{option}</span>
                              {isAnswered && isCorrect && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              )}
                              {isAnswered && isSelected && !isCorrect && (
                                <XCircle className="h-5 w-5 text-rose-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-slate-800">School Chat</h2>
            <ChatRoom roomId="school-wide-broadcast" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIQuizGenerator;