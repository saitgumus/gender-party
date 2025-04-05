import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabase';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
`;

const GameContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
`;

const Button = styled(motion.button) <{ color: string }>`
  background: ${props => props.color};
  color: white;
  border: none;
  padding: 1rem 2rem;
  margin: 0.5rem;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  width: 150px;
`;

const ResultBox = styled(motion.div) <{ color: string }>`
  width: 200px;
  height: 200px;
  background: ${props => props.color};
  border-radius: 15px;
  margin: 2rem auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 100%;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  padding: 0.8rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 100%;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const GuessList = styled.div`
  margin-top: 2rem;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const GuessItem = styled(motion.div) <{ color: string }>`
  background: #f8f9fa;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  border-left: 4px solid ${props => props.color === 'pink' ? '#FF69B4' : '#1E90FF'};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(5px);
  }

  strong {
    color: ${props => props.color === 'pink' ? '#FF69B4' : '#1E90FF'};
  }

  small {
    display: block;
    margin-top: 0.5rem;
    color: #666;
    font-size: 0.8rem;
  }

  p {
    margin: 0.5rem 0;
    color: #333;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const StatItem = styled.div<{ color: string }>`
  text-align: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: ${props => props.color};
  color: white;
  font-weight: bold;
`;

const Loading = styled.div`
  text-align: center;
  padding: 1rem;
  color: #666;
`;

interface Guess {
  id: string;
  name: string;
  message: string;
  guess: 'pink' | 'blue';
  created_at: string;
}

function App() {
  const [showResult, setShowResult] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tahminleri yükle
    fetchGuesses();

    // Gerçek zamanlı güncellemeleri dinle
    const subscription = supabase
      .channel('guesses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guesses' }, () => {
        fetchGuesses();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchGuesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuesses(data || []);
    } catch (err) {
      setError('Tahminler yüklenirken bir hata oluştu.');
      console.error('Error fetching guesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (color: string) => {
    if (!name.trim()) {
      alert('Lütfen isminizi girin!');
      return;
    }

    try {
      const { error } = await supabase
        .from('guesses')
        .insert([
          {
            name: name.trim(),
            message: message.trim(),
            guess: color as 'pink' | 'blue',
          },
        ]);

      if (error) throw error;

      setSelectedColor(color);
      setShowResult(true);
      setShowConfetti(true);
    } catch (err) {
      setError('Tahmininiz kaydedilirken bir hata oluştu.');
      console.error('Error saving guess:', err);
    }
  };

  const stats = {
    pink: guesses.filter(g => g.guess === 'pink').length,
    blue: guesses.filter(g => g.guess === 'blue').length,
    total: guesses.length
  };

  return (
    <AppContainer>
      {showConfetti && <Confetti />}
      <Title>Pembe mi, Mavi mi? 🎉</Title>
      <GameContainer>
        {!showResult ? (
          <>
            <h2>Bebeğin cinsiyetini tahmin et!</h2>
            <Input
              type="text"
              placeholder="İsminiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextArea
              placeholder="Bebek için mesajınız (isteğe bağlı)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <ButtonContainer>
              <Button
                color="#FF69B4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGuess('pink')}
              >
                Pembe 👶
              </Button>
              <Button
                color="#1E90FF"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGuess('blue')}
              >
                Mavi 👶
              </Button>
            </ButtonContainer>
          </>
        ) : (
          <>
            <ResultBox
              color={selectedColor === 'pink' ? '#FF69B4' : '#1E90FF'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {selectedColor === 'pink' ? 'KIZ 👧' : 'ERKEK 👦'}
            </ResultBox>
            <Button
              color="#4CAF50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowResult(false);
                setShowConfetti(false);
                setName('');
                setMessage('');
              }}
            >
              Yeni Tahmin
            </Button>
          </>
        )}
      </GameContainer>
      {error && (
        <GameContainer>
          <p style={{ color: 'red' }}>{error}</p>
        </GameContainer>
      )}
      <GameContainer>
        <h3>Tahminler</h3>
        <StatsContainer>
          <StatItem color="#FF69B4">
            Kız: {stats.pink}
          </StatItem>
          <StatItem color="#1E90FF">
            Erkek: {stats.blue}
          </StatItem>
          <StatItem color="#4CAF50">
            Toplam: {stats.total}
          </StatItem>
        </StatsContainer>
        {loading ? (
          <Loading>Yükleniyor...</Loading>
        ) : (
          <GuessList>
            {guesses.map((guess) => (
              <GuessItem
                key={guess.id}
                color={guess.guess}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <strong>{guess.name}</strong>
                <p>{guess.message}</p>
                <small>{new Date(guess.created_at).toLocaleString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</small>
              </GuessItem>
            ))}
          </GuessList>
        )}
      </GameContainer>
    </AppContainer>
  );
}

export default App;
