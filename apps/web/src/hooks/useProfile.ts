import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  user_type: string;
  subscription_level: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profiles/me', { credentials: 'include' });
      if (response.ok) {
        const data = (await response.json()) as UserProfile;
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  return { profile, isLoading, error, refetchProfile: fetchProfile };
}
