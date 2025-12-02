import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GoogleLoginButton() {
    const { login } = useAuth();
    const router = useRouter();
    const [error, setError] = useState('');

    const handleSuccess = async (credentialResponse: any) => {
        try {
            const { data } = await api.post('/auth/google', {
                token: credentialResponse.credential,
            });
            login(data.token, data);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Google login error', err);
            setError(err.response?.data?.message || 'Google login failed');
        }
    };

    return (
        <div className="w-full flex flex-col items-center mt-4">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => {
                    setError('Google Login Failed');
                }}
                theme="outline"
                size="large"
                width="100%"
                locale="en"
                text="signin_with"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
}
