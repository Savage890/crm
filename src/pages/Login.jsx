import { useNavigate } from 'react-router-dom'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import { HiOutlineCog } from 'react-icons/hi'

export default function Login() {
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) navigate('/', { replace: true })
    }, [user, navigate])

    return (
        <div className="login-page">
            <div className="login-bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <div className="logo-icon large">N</div>
                    </div>
                    <h1>NexusCRM</h1>
                    <p>Manage your relationships, close more deals</p>
                </div>
                {!supabaseConfigured ? (
                    <div className="setup-notice">
                        <h3><HiOutlineCog size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />Setup Required</h3>
                        <p>Create a <code>.env</code> file in the project root with your Supabase credentials:</p>
                        <pre>{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
                        <p className="setup-hint">Get these from your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a> &rarr; Settings &rarr; API</p>
                    </div>
                ) : (
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#7c3aed',
                                        brandAccent: '#6d28d9',
                                        inputBackground: 'rgba(255,255,255,0.06)',
                                        inputBorder: 'rgba(255,255,255,0.1)',
                                        inputText: '#e2e8f0',
                                        inputPlaceholder: '#64748b',
                                        inputBorderFocus: '#7c3aed',
                                        inputBorderHover: 'rgba(124,58,237,0.4)',
                                    },
                                    borderWidths: {
                                        buttonBorderWidth: '0px',
                                        inputBorderWidth: '1px',
                                    },
                                    radii: {
                                        borderRadiusButton: '10px',
                                        buttonBorderRadius: '10px',
                                        inputBorderRadius: '10px',
                                    },
                                    fonts: {
                                        bodyFontFamily: `'Inter', sans-serif`,
                                        buttonFontFamily: `'Inter', sans-serif`,
                                        inputFontFamily: `'Inter', sans-serif`,
                                        labelFontFamily: `'Inter', sans-serif`,
                                    },
                                },
                            },
                            className: {
                                container: 'auth-container',
                                button: 'auth-button',
                                input: 'auth-input',
                                label: 'auth-label',
                                anchor: 'auth-anchor',
                            },
                        }}
                        theme="dark"
                        providers={[]}
                    />
                )}
            </div>
        </div>
    )
}
