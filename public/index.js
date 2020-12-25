const { fail } = require('assert')

;(async () => {
  const fs = require('fs')
  const nodemailer = require('nodemailer')
  const { resolve } = require('path')
  const qs = require('querystring')

  let config = JSON.parse(fs.readFileSync(resolve(__dirname, './config.json')))
  let mail = JSON.parse(fs.readFileSync(resolve(__dirname, './mail.json')))

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

  inputEmail.addEventListener('click', () => {
    inputName.dataset.active = false
    inputEmail.dataset.active = true

    document.querySelector('.keyboard').dataset.lang = 'en'
  })
  inputName.addEventListener('click', () => {
    inputName.dataset.active = true
    inputEmail.dataset.active = false
  })
  inputEmail.addEventListener('change', () => {
    console.log(inputEmail.value)
  })
  inputEmail.addEventListener('input', () => {
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
    const pathToPhoto = `${pathToPhotos}/${e.currentTarget.dataset.picture}`
    currentPicture = e.currentTarget.dataset.picture
    bigImageStart.style.backgroundImage = `url('${pathToPhoto}')`
    bigImageFill.style.backgroundImage = `url('${pathToPhoto}')`

    btnNext.disabled = false
  }

  const renderPhotos = async () => {
    let photos = await getPhotos(pathToPhotos)
    thumbnailsContainer.innerHTML = ''
    photos.forEach(photo => {
      pathToPhoto = `${pathToPhotos}/${photo}`

      const photoDiv = document.createElement('div')
      photoDiv.addEventListener('click', showOnBigPicture)
      photoDiv.style.backgroundImage = `url('${pathToPhoto}')`
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
            return (
              file.split('.')[0].split('_')[
                file.split('.')[0].split('_').length - 1
              ] === 'Frame'
            )
          })
          resolve([...filteredFiles])
        }
      })
    })
  }

  const activateWatching = folder => {
    fs.watch(folder, () => {
      renderPhotos()
    })
  }

  renderPhotos()
  activateWatching(pathToPhotos)

  btnNext.addEventListener('click', () => {
    if (currentPicture) {
      pages[0].classList.add('hidden')
      pages[1].classList.remove('hidden')
    }
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
      let info = await transporter.sendMail(mailToSend)
      pages[2].classList.add('hidden')
      pages[3].classList.remove('hidden')
      inputEmail.value = ''
      inputName.value = ''
      btnSend.disabled = true
      setTimeout(() => {
        pages[3].classList.add('hidden')
        pages[0].classList.remove('hidden')
      }, 1500)
    }

    main().catch(console.error)
  })

  const enableKeyboard = () => {
    const keyboard = document.querySelector('.keyboard')
    const keys = Array.from(
      document.querySelectorAll('.keyboard .key[data-key]')
    )

    const shiftUp = () => {
      keyboard.dataset.shifted = true
      keys.forEach(key => {
        key.textContent = key.textContent.toUpperCase()
        key.dataset.key = key.dataset.key.toUpperCase()
      })
    }

    const shiftDown = () => {
      keyboard.dataset.shifted = false
      keys.forEach(key => {
        key.textContent = key.textContent.toLowerCase()
        key.dataset.key = key.dataset.key.toLowerCase()
      })
    }

    keys.forEach(key => {
      key.addEventListener('click', () => {
        const input = document.querySelector('input[data-active="true"]')
        input.value += key.dataset.key
        keyboard.dataset.shifted === 'true' ? shiftDown() : null
        if (inputEmail.value !== '') {
          if (inputName.value !== '') {
            if (!/\d/.test(inputName.value)) {
              if (
                /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(
                  inputEmail.value
                )
              ) {
                btnSend.disabled = false
              }
            }
          }
        }
      })
    })

    const actionKeys = Array.from(
      document.querySelectorAll('.keyboard .key[data-action-key]')
    )
    actionKeys.forEach(key => {
      key.addEventListener('click', () => {
        const input = document.querySelector('input[data-active="true"]')
        switch (key.dataset['actionKey']) {
          case 'backspace':
            let value = input.value.split('')
            value.pop()
            input.value = value.join('')
            break
          case 'shift':
            keyboard.dataset.shifted === 'true' ? shiftDown() : shiftUp()
            break
          case 'lang':
            keyboard.dataset.lang =
              keyboard.dataset.lang === 'en' ? 'rus' : 'en'
            break
          case 'num':
            keyboard.dataset.layout =
              keyboard.dataset.layout === 'text' ? 'num' : 'text'
            break

          default:
            break
        }
      })
    })
  }
  enableKeyboard()
})()
