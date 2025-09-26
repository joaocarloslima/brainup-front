'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Send, CheckCircle, XCircle, Brain, LogOut } from "lucide-react"
import { exitQuiz } from "@/actions"

interface Question {
  id: number
  question: string
  alternatives: string[]
  correctAnswer: number
}

export default function QuizPage() {
  // Estado da pergunta atual
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isWaitingForQuestion, setIsWaitingForQuestion] = useState(true)

  // Estados do timer e progresso
  const [timeLeft, setTimeLeft] = useState(10)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [progressValue, setProgressValue] = useState(100)

  // Estados da resposta
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)

  // Timer countdown
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0 || hasAnswered || !currentQuestion) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1
        setProgressValue((newTime / 10) * 100)
        
        if (newTime <= 0) {
          setIsTimerActive(false)
          handleTimeUp()
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isTimerActive, hasAnswered, currentQuestion])

  // Função chamada quando o tempo acaba
  const handleTimeUp = useCallback(() => {
    if (!hasAnswered) {
      setHasAnswered(true)
      setShowResult(true)
      console.log('Tempo esgotado! Nenhuma resposta foi enviada.')
    }
  }, [hasAnswered])

  // Função para selecionar alternativa
  const handleSelectAnswer = (answerIndex: number) => {
    if (!hasAnswered && timeLeft > 0 && currentQuestion) {
      setSelectedAnswer(answerIndex)
    }
  }

  // Função para enviar resposta
  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || isSubmitting || hasAnswered || !currentQuestion) return

    setIsSubmitting(true)
    setIsTimerActive(false)

    try {
      const response = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: selectedAnswer,
          timeUsed: 10 - timeLeft
        }),
      })

      if (response.ok) {
        console.log('Resposta enviada:', selectedAnswer)
        setHasAnswered(true)
        setShowResult(true)
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função para aguardar próxima questão
  const handleNextQuestion = () => {
    setIsWaitingForQuestion(true)
    setTimeLeft(10)
    setProgressValue(100)
    setIsTimerActive(false)
    setSelectedAnswer(null)
    setIsSubmitting(false)
    setHasAnswered(false)
    setShowResult(false)
    setCurrentQuestion(null)
  }

  // Determinar cor da barra de progresso baseada no tempo
  const getProgressColor = () => {
    if (timeLeft > 7) return "bg-green-500"
    if (timeLeft > 4) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header com Logo e Botão Sair */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">BrainUp Quiz</h1>
              <p className="text-sm text-slate-600">
                {isWaitingForQuestion ? 'Aguardando questão...' : `Pergunta ${currentQuestion?.id || 0}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer (apenas quando há questão ativa) */}
            {!isWaitingForQuestion && currentQuestion && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-red-500' : 'text-slate-600'}`} />
                  <span className={`text-2xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-slate-900'}`}>
                    {timeLeft}s
                  </span>
                </div>
                <Badge variant={timeLeft <= 3 ? "destructive" : "secondary"}>
                  {timeLeft > 0 ? 'Tempo restante' : 'Tempo esgotado!'}
                </Badge>
              </div>
            )}
            <form action={exitQuiz}>
                <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 hover:border-red-300"
                >
                <LogOut className="w-4 h-4" />
                    Sair
                </Button>
            </form>
          </div>
        </div>

        {/* Conteúdo Condicional */}
        {isWaitingForQuestion ? (
          /* Tela de Espera */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <CardTitle className="text-xl">Aguardando Questão</CardTitle>
                <CardDescription>
                  Esperando o administrador enviar uma nova questão...
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                  <p className="text-sm text-slate-600">
                    Você será notificado quando uma nova questão estiver disponível
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Tela do Quiz */
          <>
            {/* Barra de Progresso do Timer */}
            <div className="mb-6">
              <Progress 
                value={progressValue} 
                className={`h-3 transition-all duration-1000 ${getProgressColor()}`}
              />
            </div>

            {/* Pergunta Principal */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  {currentQuestion?.question}
                </CardTitle>
                <CardDescription className="text-center">
                  Selecione uma alternativa e clique em "Enviar Resposta"
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Alternativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentQuestion?.alternatives.map((alternative, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-200'
                      : 'hover:bg-slate-50 hover:border-slate-300'
                  } ${
                    hasAnswered || timeLeft === 0 ? 'cursor-not-allowed opacity-60' : ''
                  } ${
                    showResult && index === currentQuestion?.correctAnswer
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
                      : ''
                  } ${
                    showResult && selectedAnswer === index && index !== currentQuestion?.correctAnswer
                      ? 'ring-2 ring-red-500 bg-red-50 border-red-200'
                      : ''
                  }`}
                  onClick={() => handleSelectAnswer(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        selectedAnswer === index
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-slate-300'
                      }`}>
                        <span className="font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <span className="flex-1 font-medium text-slate-900">
                        {alternative}
                      </span>
                      
                      {/* Mostrar resultado após resposta */}
                      {showResult && index === currentQuestion?.correctAnswer && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                      {showResult && selectedAnswer === index && index !== currentQuestion?.correctAnswer && (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col gap-4">
              {!hasAnswered && timeLeft > 0 && (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null || isSubmitting}
                  className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Enviar Resposta
                    </div>
                  )}
                </Button>
              )}

              {/* Resultado */}
              {showResult && (
                <Card className={`${
                  selectedAnswer === currentQuestion?.correctAnswer
                    ? 'bg-green-50 border-green-200'
                    : timeLeft === 0 && selectedAnswer === null
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {selectedAnswer === currentQuestion?.correctAnswer ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="text-lg font-bold text-green-800">Correto!</span>
                        </>
                      ) : timeLeft === 0 && selectedAnswer === null ? (
                        <>
                          <Clock className="w-6 h-6 text-yellow-600" />
                          <span className="text-lg font-bold text-yellow-800">Tempo Esgotado!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-red-600" />
                          <span className="text-lg font-bold text-red-800">Incorreto!</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {selectedAnswer === currentQuestion?.correctAnswer
                        ? 'Parabéns! Você acertou a resposta.'
                        : timeLeft === 0 && selectedAnswer === null
                        ? 'O tempo acabou antes de você responder.'
                        : `A resposta correta era: ${String.fromCharCode(65 + (currentQuestion?.correctAnswer || 0))} - ${currentQuestion?.alternatives[currentQuestion?.correctAnswer || 0]}`
                      }
                    </p>
                    
                    <Button
                      onClick={handleNextQuestion}
                      className="mt-4 bg-slate-600 hover:bg-slate-700"
                    >
                      Aguardar Próxima Questão
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}