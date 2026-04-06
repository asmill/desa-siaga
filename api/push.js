export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { targetIds, emergencyType } = req.body;
  const restKey = process.env.VITE_ONESIGNAL_REST_KEY;

  if (!restKey) {
    return res.status(500).json({ error: 'Environment Variable VITE_ONESIGNAL_REST_KEY belum disetel di Vercel' });
  }

  if (!targetIds || targetIds.length === 0) {
    return res.status(400).json({ error: 'Tidak ada supir standby yang ditargetkan' });
  }

  const payload = {
    app_id: "f48de674-ea17-4e38-b10f-a2808fcae5f8",
    include_aliases: { external_id: targetIds },
    target_channel: "push",
    contents: { en: `Darurat Medis: ${emergencyType || 'Tindakan Cepat'}! Buka radar SOS sekarang.` },
    headings: { en: "🚨 PANGGILAN SOS MASUK! 🚨" }
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}
