import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Разрешаем запросы с сайта (dev + прод)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://deichmann-traffic.ru' // замени на свой домен
  ]
}))

app.use(express.json())

// Настройка SMTP для Sprinthost
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // true для порта 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Проверка телефона: +7 (9XX) XXX-XX-XX
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 11 && digits[0] === '7' && digits[1] === '9'
}

// Эндпоинт для приёма заявок
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Телефон обязателен' })
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Неверный формат телефона' })
    }

    await transporter.sendMail({
      from: `"Дайхманн Трафик" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_TO,
      subject: '🔥 Новая заявка с сайта',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #F97316;">Новая заявка</h2>
          <p><strong>Имя:</strong> ${name || 'Не указано'}</p>
          <p><strong>Телефон:</strong> ${phone}</p>
          <p><strong>Время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
        </div>
      `
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка:', error)
    res.status(500).json({ error: 'Не удалось отправить заявку' })
  }
})

// Проверка работоспособности
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`)
})