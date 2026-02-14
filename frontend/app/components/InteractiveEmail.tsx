import React from 'react';

export default function InteractiveEmail({ title, body, action_url, action_text }: { title: string, body: string, action_url: string, action_text: string }) {
    return (
        <div style={{
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'sans-serif',
            padding: '40px',
            borderRadius: '8px',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '20px' }}>{title}</h1>
            <p style={{ fontSize: '16px', lineHeight: '1.5', color: '#ccc', margin: '20px 0' }}>{body}</p>
            <a href={action_url} style={{
                backgroundColor: '#fff',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
            }}>
                {action_text}
            </a>
            <footer style={{ marginTop: '40px', fontSize: '12px', color: '#666' }}>
                Sent by Genii Autonomous Ecosystem - High Quality Service Always.
            </footer>
        </div>
    );
}
