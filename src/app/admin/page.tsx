'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Users, Trophy, CheckCircle } from "lucide-react"

interface Player {
  id: string
  name: string
  score: number
  active: boolean
}

export default function AdminPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleQuestionChange = async (questionNumber: number) => {
    setIsLoading(true)
    setSelectedQuestion(questionNumber)
    
    try {
      // Aqui você fará a requisição para o servidor
      const response = await fetch('/api/change-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionNumber }),
      })
      
      if (response.ok) {
        console.log(`Questão ${questionNumber} enviada para o servidor`)
        // Mostrar feedback visual de sucesso
        setTimeout(() => setSelectedQuestion(null), 2000)
      }
    } catch (error) {
      console.error('Erro ao trocar questão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // SSE para receber eventos do servidor
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/stream/admin')

    console.log('Conexão SSE iniciada com o servidor ' + eventSource.url)

    // ✅ Escutar eventos nomeados específicos
    eventSource.addEventListener('player.joined', (event: any) => {
      console.log('=== EVENTO player.joined RECEBIDO ===')
      console.log('Dados recebidos:', event.data)
      
      try {
        const newPlayer: Player = JSON.parse(event.data)
        console.log('Player parseado:', newPlayer)
        
        setPlayers(prevPlayers => {
          const playerExists = prevPlayers.some(player => player.id === newPlayer.id)
          if (!playerExists) {
            console.log('✅ Novo player adicionado:', newPlayer.name)
            return [...prevPlayers, newPlayer]
          } else {
            console.log('⚠️ Player já existe na lista:', newPlayer.name)
          }
          return prevPlayers
        })
      } catch (error) {
        console.error('❌ Erro ao processar player.joined:', error)
      }
    })

    // ✅ Escutar evento player.exited
    eventSource.addEventListener('player.exited', (event: any) => {
      console.log('=== EVENTO player.exited RECEBIDO ===')
      console.log('Dados recebidos:', event.data)
      
      try {
        const exitedPlayer: Player = JSON.parse(event.data)
        console.log('Player que saiu:', exitedPlayer)
        
        setPlayers(prevPlayers => {
          return prevPlayers.map(player => {
            if (player.id === exitedPlayer.id) {
              console.log('🔴 Player saiu:', player.name)
              return {
                ...player,
                active: false // Marca como offline
              }
            }
            return player
          })
        })
      } catch (error) {
        console.error('❌ Erro ao processar player.exited:', error)
      }
    })

    // ✅ Manter onmessage para eventos genéricos/debug
    eventSource.onmessage = (event) => {
      console.log('=== EVENTO GENÉRICO RECEBIDO ===')
      console.log('Tipo:', event.type)
      console.log('Dados:', event.data)
    }
    
    eventSource.onerror = (error) => {
      console.error('❌ Erro na conexão SSE:', error)
      console.log('ReadyState:', eventSource.readyState)
    }
    
    eventSource.onopen = () => {
      console.log('✅ Conexão SSE estabelecida com o servidor')
    }
    
    // Cleanup
    return () => {
      eventSource.close()
      console.log('🔌 Conexão SSE fechada')
    }
  }, [])

  // Função para testar saída de player (desenvolvimento)
  const simulatePlayerExit = () => {
    if (players.length > 0) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)]
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          if (player.id === randomPlayer.id && player.active) {
            console.log('🔴 Simulando saída do player:', player.name)
            return { ...player, active: false }
          }
          return player
        })
      })
    }
  }

  // Função para adicionar player de teste
  const addTestPlayer = () => {
    const testPlayer: Player = {
      id: `test-${Date.now()}`,
      name: `Player Teste ${Date.now()}`,
      score: Math.floor(Math.random() * 10),
      active: true
    }
    
    setPlayers(prev => [...prev, testPlayer])
    console.log('Player de teste adicionado:', testPlayer)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Painel do Administrador
              </h1>
              <p className="text-slate-600">
                Gerencie questões e acompanhe o desempenho dos usuários
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Controle de Questões */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Controle de Questões
                </CardTitle>
                <CardDescription>
                  Selecione uma questão para exibir aos participantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((questionNum) => (
                    <Button
                      key={questionNum}
                      variant={selectedQuestion === questionNum ? "default" : "outline"}
                      className={`h-16 text-lg font-semibold transition-all ${
                        selectedQuestion === questionNum 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "hover:bg-blue-50 hover:border-blue-300"
                      }`}
                      onClick={() => handleQuestionChange(questionNum)}
                      disabled={isLoading}
                    >
                      {isLoading && selectedQuestion === questionNum ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Q{questionNum}
                          {selectedQuestion === questionNum && (
                            <CheckCircle className="w-4 h-4 ml-1" />
                          )}
                        </>
                      )}
                    </Button>
                  ))}
                </div>
                
                {selectedQuestion && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✓ Questão {selectedQuestion} foi enviada aos participantes
                    </p>
                  </div>
                )}

                {/* Seção de Debug/Teste */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-700 mb-3">🔧 Debug & Testes</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addTestPlayer}
                      className="text-xs"
                    >
                      👤 Adicionar Player Teste
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={simulatePlayerExit}
                      className="text-xs"
                      disabled={players.filter(p => p.active).length === 0}
                    >
                      🚪 Simular Saída de Player
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Usuários */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Participantes
                  <span className="text-sm font-normal text-slate-500">
                    ({players.filter(u => u.active).length} online)
                  </span>
                </CardTitle>
                <CardDescription>
                  Ranking e status dos participantes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-4 border-b last:border-b-0 ${
                          !player.active ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-500 w-6">
                              #{index + 1}
                            </span>
                            <div
                              className={`w-3 h-3 rounded-full ${
                                player.active ? 'bg-green-400' : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {player.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {player.active ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Trophy 
                            className={`w-4 h-4 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-slate-400' : 
                              index === 2 ? 'text-orange-600' : 
                              'text-slate-300'
                            }`} 
                          />
                          <span className="font-bold text-lg text-slate-900">
                            {player.score}
                          </span>
                          <span className="text-sm text-slate-500">
                            /10
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estatísticas Resumidas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Participantes</p>
                  <p className="text-2xl font-bold text-slate-900">{players.length}</p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Participantes Online</p>
                  <p className="text-2xl font-bold text-green-600">
                    {players.filter(u => u.active).length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pontuação Média</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {players.length > 0 ? (players.reduce((acc, player) => acc + player.score, 0) / players.length).toFixed(1) : '0.0'}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
