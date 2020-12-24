;(async () => {
  const fs = require('fs')
  const nodemailer = require('nodemailer')
  const { resolve } = require('path')

  let config = JSON.parse(fs.readFileSync(resolve(__dirname, './config.json')))
  let mail = JSON.parse(fs.readFileSync(resolve(__dirname, './mail.json')))
  console.log({ ...mail, attachments: 'hello' })

  const pages = [
    document.querySelector('.start'),
    document.querySelector('.filling'),
    document.querySelector('.sending'),
    document.querySelector('.sent'),
  ]
  const bigImageStart = document.querySelector('.start .img')
  const bigImageFill = document.querySelector('.filling .img')
  const thumbnailsContainer = document.querySelector('.photos .grid')
  const inputName = document.querySelector('input[name="name"]')
  const inputEmail = document.querySelector('input[name="mail"]')
  const btnNext = document.querySelector('button[data-action="next"]')
  const btnSend = document.querySelector('button[data-action="send"]')
  const btnBack = document.querySelector('button[data-action="back"]')
  console.log(btnBack)

  inputEmail.addEventListener('input', () => {
    console.log(inputEmail.value)
    console.log(inputName.value)
    if (
      inputEmail.value !== '' &&
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(
        inputEmail.value
      ) &&
      inputName.value !== ''
    ) {
      btnSend.disabled = false
    }
  })
  inputName.addEventListener('input', () => {
    console.log(inputEmail.value)
    console.log(inputName.value)
    if (
      inputEmail.value !== '' &&
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(
        inputEmail.value
      ) &&
      inputName.value !== ''
    ) {
      btnSend.disabled = false
    }
  })

  const pathToPhotos = config.pathToPhotos
  let currentPicture = ''

  const showOnBigPicture = e => {
    pathToPhoto = `${pathToPhotos}/${e.currentTarget.dataset.picture}`
    currentPicture = e.currentTarget.dataset.picture
    bigImageStart.style.backgroundImage = `url('${pathToPhoto}')`
    bigImageFill.style.backgroundImage = `url('${pathToPhoto}')`
  }

  const renderPhotos = async () => {
    let photos = await getPhotos(pathToPhotos)
    thumbnailsContainer.innerHTML = ''
    photos.forEach(photo => {
      const path = `${pathToPhotos}/${photo}`

      const photoDiv = document.createElement('div')
      photoDiv.addEventListener('click', showOnBigPicture)
      photoDiv.style.backgroundImage = `url('${path}')`
      photoDiv.dataset.picture = photo

      thumbnailsContainer.appendChild(photoDiv)
    })
  }

  const getPhotos = async folder => {
    return new Promise((resolve, reject) => {
      fs.readdir(folder, (err, files) => {
        if (err) {
          reject(err)
        } else {
          let filteredFiles = files.filter(file => {
            return file.split('.')[file.split('.').length - 1] === 'jpg'
          })
          resolve([...filteredFiles])
        }
      })
    })
  }

  const activateWatching = folder => {
    console.log('watching started', folder)
    fs.watch(folder, () => {
      renderPhotos()
    })
  }

  renderPhotos()
  activateWatching(pathToPhotos)

  btnNext.addEventListener('click', () => {
    pages[0].classList.add('hidden')
    pages[1].classList.remove('hidden')
  })
  btnBack.addEventListener('click', () => {
    pages[1].classList.add('hidden')
    pages[0].classList.remove('hidden')
  })
  btnSend.addEventListener('click', () => {
    pages[1].classList.add('hidden')
    pages[2].classList.remove('hidden')
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
      let mailToSend = {
        ...mail,
        attachments: [
          {
            filename: 'photo.png',
            content: fs.createReadStream(resolve(pathToPhotos, currentPicture)),
          },
        ],
      }
      mailToSend.to = inputEmail.value
      mailToSend.html = mailToSend.html.replace(/({name})/g, inputName.value)
      console.log(mailToSend.html)
      let info = await transporter.sendMail(mailToSend)
      pages[2].classList.add('hidden')
      pages[3].classList.remove('hidden')
      inputEmail.value = ''
      inputName.value = ''
      setTimeout(() => {
        pages[3].classList.add('hidden')
        pages[0].classList.remove('hidden')
      }, 1500)
    }

    main().catch(console.error)
  })
})()
