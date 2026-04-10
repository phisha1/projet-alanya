import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock pour l'inscription (Étape 2)
  http.post('/api/auth/register', () => {
    console.log('[MSW] Intercepted register');
    return HttpResponse.json({ success: true, message: "Compte créé avec succès (MOCK)" })
  }),

  // Mock pour l'envoi d'OTP (Étape 2 après register ou Étape 3 via bouton renvoyer)
  http.post('/api/auth/send-otp', () => {
    console.log('[MSW] Intercepted send-otp');
    return HttpResponse.json({ success: true, message: "OTP envoyé (MOCK)" })
  }),

  // Mock pour la vérification OTP (Étape 3)
  http.post('/api/auth/verify-otp', () => {
    console.log('[MSW] Intercepted verify-otp');
    // On retourne un succès direct pour n'importe quel code saisi
    return HttpResponse.json({ success: true, message: "Code vérifié (MOCK)" })
  }),

  // Mock pour le login (si utilisé ailleurs)
  http.post('/api/auth/login', () => {
    console.log('[MSW] Intercepted login');
    return HttpResponse.json({ success: true, message: "Connecté (MOCK)" })
  }),
]
