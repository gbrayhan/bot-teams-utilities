require('dotenv').config();
const puppeteer = require('puppeteer');
const twilio = require('twilio');

const client = new twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppMessage(message) {
    try {
        await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${process.env.MY_PHONE_NUMBER}`,
        });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
    }
}

async function main() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://teams.microsoft.com/', { waitUntil: 'networkidle2' });

    // Log in to Microsoft Teams
    // Replace with your actual email and password
    await page.type('#i0116', 'my@mail.com');
    await page.click('#idSIButton9');
    await page.waitForTimeout(2000);
    await page.type('#i0118', 'Pssword1');
    await page.click('#idSIButton9');
    await page.waitForTimeout(5000);
    await page.click('#idBtn_Back');
    await page.waitForTimeout(5000);

    // Navigate to the desired chat in Microsoft Teams
    // Replace `chatId` with the actual chat ID in the URL
    const chatId = 'your_chat_id';
    await page.goto(`https://teams.microsoft.com/_#/conversations/${chatId}`, {
        waitUntil: 'networkidle2',
    });

    await page.waitForTimeout(5000);

    // Inject JavaScript code to monitor messages
    await page.evaluate(() => {
        const targetNode = document.querySelector('.ts-message-list-container');
        const config = { childList: true, subtree: true };
        const callback = (mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const addedNode of mutation.addedNodes) {
                        if (addedNode.classList.contains('message-list-item')) {
                            const messageText = addedNode.innerText;
                            // Send the message to WhatsApp
                            window.sendMessageToWhatsApp(messageText);
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    });

    // Expose the sendWhatsAppMessage function to the page context
    await page.exposeFunction('sendMessageToWhatsApp', sendWhatsAppMessage);

    // Keep the script running
    await new Promise((resolve) => setTimeout(resolve, 24 * 60 * 60 * 1000));
}

main();
