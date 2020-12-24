const nodemailer = require('nodemailer')
const fs = require('fs')

const main = async () => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: 'photo@samara-arena.info',
      pass: 'dTctSIke',
    },
  })

  let info = await transporter.sendMail({
    from: '"Arena FC" <photo@samara-arena.info>',
    to: 'bogdan.bryzh@gmail.com',
    subject: 'Hello ✔',
    html: '<b>Hello world?</b>',
    attachments: [
      {
        filename: 'photo.png',
        content: fs.createReadStream('./public/img/bg.png'),
      },
    ],
  })
}

main().catch(console.error)
