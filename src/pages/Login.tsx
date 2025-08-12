import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { LogIn } from 'lucide-react';

interface LoginProps {
  isInactive?: boolean;
}

function Login({ isInactive }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create a document in the "benutzer" collection with default role "inaktiv"
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role: 'inaktiv',
          createdAt: new Date(),
          lastLogin: new Date()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(isRegistering 
        ? 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.' 
        : 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold ml-2">Projektmanagement</h1>
        </div>

        {isInactive && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
            Ihr Account ist noch nicht freigeschaltet. Bitte wenden Sie sich an einen Administrator.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                {isRegistering ? 'Registriere...' : 'Anmelde...'}
              </>
            ) : (
              isRegistering ? 'Registrieren' : 'Anmelden'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isRegistering ? 'Bereits registriert?' : 'Noch kein Konto?'}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-1 text-blue-500 hover:text-blue-600"
            disabled={isLoading}
          >
            {isRegistering ? 'Zur Anmeldung' : 'Jetzt registrieren'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;