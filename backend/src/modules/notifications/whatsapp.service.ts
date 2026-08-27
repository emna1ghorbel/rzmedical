// Uses the native fetch available in Node.js 18+. No extra package required.

/**
 * Sends a WhatsApp notification to the admin via CallMeBot.
 * Requires:
 *   WHATSAPP_ADMIN_PHONE  — admin's phone number with country code, no + or spaces (ex: 21612345678)
 *   WHATSAPP_CALLMEBOT_APIKEY — API key received after activating CallMeBot
 *
 * Activation (one-time, from the admin's WhatsApp):
 *   Send "I allow callmebot to send me messages" to +34 644 59 72 96
 */
export async function notifyAdminNewOrder(
  orderId: number,
  clientNom: string,
  clientPrenom: string,
  clientTelephone: string | null | undefined,
  total: number,
  nbArticles: number
): Promise<void> {
  const phone = process.env.WHATSAPP_ADMIN_PHONE;
  const apiKey = process.env.WHATSAPP_CALLMEBOT_APIKEY;

  if (!phone || !apiKey) {
    console.log(`📱 [WhatsApp] Non configuré — commande #${orderId} non notifiée.`);
    return;
  }

  const lines = [
    `🛒 *Nouvelle commande #${orderId}*`,
    `👤 Client : ${clientPrenom} ${clientNom}`,
    clientTelephone ? `📞 Tél : ${clientTelephone}` : null,
    `🧾 Articles : ${nbArticles}`,
    `💰 Total : ${total.toFixed(3)} TND`,
    `🔗 Voir : http://192.168.1.104:3001/orders`,
  ]
    .filter(Boolean)
    .join('\n');

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(lines)}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`📱 [WhatsApp] Erreur CallMeBot: ${res.status} ${res.statusText}`);
    } else {
      console.log(`📱 [WhatsApp] Notification commande #${orderId} envoyée.`);
    }
  } catch (err) {
    console.warn(`📱 [WhatsApp] Impossible d'envoyer la notification:`, err);
  }
}
