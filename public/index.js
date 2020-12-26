;(async () => {
  const { ipcRenderer } = require('electron')
  const fs = require('fs')
  const path = require('path')
  const nodemailer = require('nodemailer')
  const { resolve } = require('path')
  const lowdb = require('lowdb')
  const FileSync = require('lowdb/adapters/FileSync')
  const json2xls = require('json2xls')

  if (!fs.existsSync('data.json')) {
    fs.writeFileSync('data.json', JSON.stringify({ users: [] }))
  }

  const adapter = new FileSync('data.json')
  const db = lowdb(adapter)

  db.defaults({ users: [] }).write()

  let config = JSON.parse(fs.readFileSync(resolve(__dirname, './config.json')))
  let mail = JSON.parse(fs.readFileSync(resolve(__dirname, './mail.json')))

  const pages = [
    document.querySelector('.start'),
    document.querySelector('.filling'),
    document.querySelector('.sending'),
    document.querySelector('.sent'),
  ]
  const bigImageStart = document.querySelector('.start .img img')
  const bigImageFill = document.querySelector('.filling .img img')
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

    document.querySelector('.keyboard').dataset.lang = 'rus'
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
  const pathToThumbnails = config.pathToThumbnails
  let currentPicture = ''

  const showOnBigPicture = e => {
    const photo = e.currentTarget.dataset.picture
    const pathToPhoto = `${pathToPhotos}/${photo.split('.')[0]}_Frame.${
      photo.split('.')[1]
    }`
    currentPicture = e.currentTarget.dataset.picture
    bigImageStart.src = pathToPhoto
    bigImageFill.src = pathToPhoto

    btnNext.disabled = false
  }

  const renderPhotos = async () => {
    let photos = await getPhotos(pathToPhotos)
    thumbnailsContainer.innerHTML = ''
    photos.forEach(photo => {
      pathToPhoto = `${pathToPhotos}/${pathToThumbnails}/${
        photo.split('.')[0]
      }_Small.${photo.split('.')[1]}`

      const photoDiv = document.createElement('div')
      photoDiv.addEventListener('click', showOnBigPicture)
      const image = document.createElement('img')
      image.src = pathToPhoto
      image.alt = photo
      photoDiv.dataset.picture = photo
      photoDiv.appendChild(image)

      thumbnailsContainer.appendChild(photoDiv)
    })
  }

  const getPhotos = async folder => {
    return new Promise((resolve, reject) => {
      fs.readdir(folder, (err, files) => {
        if (err) {
          reject(err)
        } else {
          files = files
            .slice(1, -1)
            .map(fileName => {
              return {
                name: fileName,
                time: fs.statSync(folder + '/' + fileName).mtime.getTime(),
              }
            })
            .sort((a, b) => {
              return b.time - a.time
            })
            .map(v => {
              return v.name
            })
            .filter(file => {
              return (
                file.split('.')[0].split('_')[
                  file.split('.')[0].split('_').length - 1
                ] !== 'Frame'
              )
            })
          console.log(files)
          resolve([...files])
        }
      })
    })
  }

  const activateWatching = folder => {
    fs.watch(folder, () => {
      setTimeout(() => renderPhotos(), 300)
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
      db.get('users')
        .push({
          name: inputName.value,
          email: inputEmail.value,
        })
        .write()
      let transporter = nodemailer.createTransport({
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true,
        auth: {
          user: 'photo@samara-arena.info',
          pass: 'dTctSIke',
        },
      })
      const photo = `${pathToPhotos}/${currentPicture.split('.')[0]}_Frame.${
        currentPicture.split('.')[1]
      }`
      let mailToSend = {
        ...mail,
        attachments: [
          {
            filename: 'photo.png',
            content: fs.createReadStream(resolve(pathToPhotos, photo)),
          },
        ],
      }
      mailToSend.to = inputEmail.value
      mailToSend.html = mailToSend.html.replace(/({name})/g, inputName.value)
      let info = await transporter.sendMail(mailToSend)
      try {
        let response = await fetch(config.url + 'd?file=' + currentPicture)
      } catch (err) {
        console.log(err)
      }
      pages[2].classList.add('hidden')
      pages[3].classList.remove('hidden')
      inputEmail.value = ''
      inputName.value = ''
      bigImageStart.src = './img/placeholder.svg'
      bigImageFill.src = './img/placeholder.svg'
      currentPicture = null
      btnSend.disabled = true
      btnNext.disabled = true
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
              } else {
                btnSend.disabled = true
              }
            } else {
              btnSend.disabled = true
            }
          } else {
            btnSend.disabled = true
          }
        } else {
          btnSend.disabled = true
        }
      })
    })

    const actionKeys = Array.from(
      document.querySelectorAll('.keyboard .key[data-action-key]')
    )
    actionKeys.forEach(key => {
      key.addEventListener('click', () => {
        if (inputEmail.value !== '') {
          if (inputName.value !== '') {
            if (!/\d/.test(inputName.value)) {
              if (
                /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(
                  inputEmail.value
                )
              ) {
                btnSend.disabled = false
              } else {
                btnSend.disabled = true
              }
            } else {
              btnSend.disabled = true
            }
          } else {
            btnSend.disabled = true
          }
        } else {
          btnSend.disabled = true
        }
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
              keyboard.dataset.layout === 'num'
                ? keyboard.dataset.lang
                : keyboard.dataset.lang === 'en'
                ? 'rus'
                : 'en'
            keyboard.dataset.layout = 'text'
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

    const deleteOnHold = () => {
      window.intervalDeleting = window.setInterval(() => {
        const input = document.querySelector('input[data-active="true"]')
        let value = input.value.split('')
        value.pop()
        input.value = value.join('')
      }, 100)
    }

    Array.from(
      document.querySelectorAll('.key[data-action-key="backspace"]')
    ).forEach(key => {
      const mouseDownHandler = () => {
        window.timeout = setTimeout(deleteOnHold, 500)
      }
      const clearAfter = () => {
        if (window.timeout) {
          window.clearTimeout(timeout)
        }
        if (window.intervalDeleting) {
          window.clearInterval(intervalDeleting)
        }
      }
      key.addEventListener('mousedown', mouseDownHandler)
      key.addEventListener('mouseup', clearAfter)
    })
  }
  enableKeyboard()

  const menuBtn = document.getElementById('menu')
  const menuBox = document.getElementById('menuBox')

  const controls = {
    reload: document.querySelector('[data-menu-action="reload"]'),
    delete: document.querySelector('[data-menu-action="delete"]'),
    saveUsers: document.querySelector('[data-menu-action="save"]'),
    deleteUsers: document.querySelector('[data-menu-action="deletejson"]'),
    close: document.querySelector('[data-menu-action="closemenu"]'),
    quit: document.querySelector('[data-menu-action="closeapp"]'),
  }

  let menuTimer

  const closeMenu = () => {
    menuBox.classList.add('hidden')
  }

  const quitApp = () => {
    window.close()
  }

  const reloadWindow = () => {
    location.reload()
  }
  const deletePicture = () => {
    try {
      fetch(config.url + 'del?file=' + currentPicture)
      bigImageFill.src = './img/placeholder.svg'
      bigImageStart.src = './img/placeholder.svg'
      btnNext.disabled = 'true'
      closeMenu()
    } catch (err) {
      alert(err)
    }
  }

  const saveToExcel = () => {
    ipcRenderer.send('select-dirs')
  }

  const showMenu = () => {
    menuBox.classList.remove('hidden')
    if (currentPicture) {
      controls.delete.classList.remove('hidden')
    }
  }

  const writeXlsx = (data, dir, filename = 'users', i = 1) => {
    let pathToXlsx = path.resolve(dir, filename + '.xlsx')
    if (fs.existsSync(pathToXlsx)) {
      filename = `users (${i++})`
      writeXlsx(data, dir, filename, i)
    } else {
      fs.writeFileSync(pathToXlsx, data, 'binary')
      closeMenu()
    }
  }

  const deleteUsersData = () => {
    if (fs.existsSync('data.json')) {
      fs.writeFileSync('data.json', '{"users":[]}')
    }
    closeMenu()
  }

  const saveExcelFile = dir => {
    const json = JSON.parse(fs.readFileSync('data.json'))
    const { users } = json
    const xlsx = json2xls(users)
    writeXlsx(xlsx, dir)
  }

  ipcRenderer.on('selected-dir', (event, args) => {
    saveExcelFile(args[0])
  })

  controls.reload.addEventListener('click', reloadWindow)
  controls.delete.addEventListener('click', deletePicture)
  controls.saveUsers.addEventListener('click', saveToExcel)
  controls.deleteUsers.addEventListener('click', deleteUsersData)
  controls.close.addEventListener('click', closeMenu)
  controls.quit.addEventListener('click', quitApp)

  const handleMouseDown = e => {
    menuTimer = setTimeout(() => {
      showMenu()
    }, 3000)
  }

  const handleMouseUp = e => {
    clearTimeout(menuTimer)
  }

  menuBtn.addEventListener('mousedown', handleMouseDown)
  menuBtn.addEventListener('mouseup', handleMouseUp)
})()
