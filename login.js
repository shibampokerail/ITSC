document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // IMPORTANT: Get this from your GitHub secrets/build process
    const n8nTestUrl = '%%CHAT_URL%%'; 

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            errorMessage.textContent = 'Please enter both username and password.';
            return;
        }

        // Encode credentials for the test request
        const credentials = btoa(`${username}:${password}`);

        try {
            // Send a test request to the n8n webhook
            const response = await fetch(n8nTestUrl, {
                method: 'POST', // Use POST as it's the expected method
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                // Send a dummy body, as n8n might expect one
                body: JSON.stringify({ "action": "login_test" }) 
            });

            // If the response is OK (2xx), login is successful
            if (response.ok) {
                // Store the credentials in sessionStorage (only lasts for the tab session)
                sessionStorage.setItem('n8nCredentials', credentials);
                // Redirect to the main chat page
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = 'Invalid username or password.';
            }
        } catch (error) {
            console.error('Login test failed:', error);
            errorMessage.textContent = 'Could not connect to the server.';
        }
    });
});
