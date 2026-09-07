/**
 * WhatsApp Service (Mock Implementation)
 * 
 * In a real application, this service would connect to a provider API
 * like Twilio, Interakt, or WATI to send message templates.
 */

export const generateOTP = () => {
    // Generate a random 6-digit number
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendWhatsAppOTP = async (phoneNumber, otp) => {
    console.log(`[WhatsApp Service] Sending OTP ${otp} to ${phoneNumber}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demonstration, we use window.alert so the user can "receive" the OTP
    // In production, remove this and make a real API call.
    alert(`[WhatsApp Mock]\n\nYour OTP for ISKCON DMS is: ${otp}\n\n(Sent to ${phoneNumber})`);

    return true;
};
