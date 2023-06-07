// SN Dingo E200-2.0.0
const { SerialPort } = require('serialport')
const { DelimiterParser } = require('@serialport/parser-delimiter')
//const { RegexParser } = require('@serialport/parser-regex')
//const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
//const url = require('url')
const os = require("os")

//const TITLE = ['порт', 'модель', 'SN', 'версия', 'поверка', 'калибровка', 'не считано', 'проведено анализов'];
const TITLE = ['порт', 'SN', 'версия', 'Текущее Время', '№1', '№2', '№3', '№4', '№5', '№6', '№7', '№8', '№9', '№10', '№11', '№12'];
var serial;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// console.log(os.homedir())

/*
const ports = [
    {
        "path": "COM18",
        "manufacturer": "Корпорация Майкрософт",
        "serialNumber": "48EC604A3232",
        "pnpId": "USB\\VID_0483&PID_5740\\48EC604A3232",
        "locationId": "Port_#0002.Hub_#0010",
        "friendlyName": "Устройство с последовательным интерфейсом USB (COM18)",
        "vendorId": "0483",
        "productId": "5740"
    },
    {
        "path": "COM17",
        "manufacturer": "Корпорация Майкрософт",
        "serialNumber": "56EF784E3231",
        "pnpId": "USB\\VID_0483&PID_5740\\56EF784E3231",
        "locationId": "Port_#0002.Hub_#0011",
        "friendlyName": "Устройство с последовательным интерфейсом USB (COM17)",
        "vendorId": "0483",
        "productId": "5740"
    },
    {
        "path": "COM21",
        "manufacturer": "Prolific",
        "serialNumber": "8&10470948&0&4",
        "pnpId": "USB\\VID_067B&PID_2303\\8&10470948&0&4",
        "locationId": "Port_#0004.Hub_#0010",
        "friendlyName": "PL2303HXA PHASED OUT SINCE 2012. PLEASE CONTACT YOUR SUPPLIER.",
        "vendorId": "067B",
        "productId": "2303"
    }
];
*/
//test();

main();

function save(fullName) {
    console.log("save:", fullName);

    let str = 'SN,Версия,Дата в компьютере,Время в компьютере,Дата в Динго,Время в Динго, №1, №2, №3, №4, №5, №6, №7, №8, №9, №10, №11, №12\n';
    for (let i = 0; i < serial.length; i++) {
        str += serial[i].infoDingo[2];
        str += ", "
        str += serial[i].infoDingo[3];
        str += ", "
        str += serial[i].date;
        str += ", "
        str += serial[i].dateDingo;

        for (let j = 0; j < serial[i].analyzes.length; j++) {
            str += ", "
            str += serial[i].analyzes[j]
        }
        str += "\n"
    }

    fs.writeFile(fullName, str, function (error) {
        if (error) throw error; // ошибка чтения файла, если есть
        let span = document.getElementById('span');
        span.textContent = ` Сохранено в ${fullName}`;
        console.log('Данные успешно записаны записать файл');
    });
}

/*
function saveFiles(){
    console.log("input:",this);
    // console.log(url.format({
    //     pathname: file.path,
    //     protocol: 'file:',
    //     slashes: true
    //   }));

    //const input = document.querySelector('input');
    //console.log(input);

    save(this.files[0].path)
}
*/
function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
    //console.log("dragenter")
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
    //console.log("dragover")
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log("drop", e)
    var files = e.dataTransfer.files;
    console.log(files[0].path);
    save(files[0].path)
}


async function main() {
    // let input = document.createElement('input'); 
    // document.getElementById('file').appendChild(input);
    // input.type = "file"
    // input.addEventListener('change', saveFiles);


    let dropbox = document.getElementsByTagName("body")[0];
    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover", dragover, false);
    dropbox.addEventListener("drop", drop, false);

    let button = document.createElement('button');
    let file = document.getElementById('file');
    file.appendChild(button);
    button.textContent = `Сохранить в папку "Documents" файл "Save.csv"`;
    button.onclick = () => save(`${os.homedir()}\\Documents\\Save.csv`)
    let span = document.createElement('span');
    span.id = "span"
    // span.textContent = ` Сохранить в папку "Documents" файл "Save.txt"`;
    file.appendChild(span);

    await SerialPort.list().then(async (ports, err) => {
        if (err) {
            document.getElementById('error').textContent = err.message
            return
        } else {
            document.getElementById('error').textContent = ''
        }
        console.log('ports', ports);
        //console.log(JSON.stringify(ports));

        if (ports.length === 0) {
            document.getElementById('error').textContent = 'Порты не обнаружены...'
        }

        serial = ports;
        // построение таблицы
        let idPort = document.getElementById('ports');
        idPort.replaceChildren();
        if (ports.length == 0) return;
        let idTab = document.createElement('table');
        idPort.appendChild(idTab);

        let title = true;
        for (const com of serial) {
            if (title) {
                let tr = document.createElement('tr');
                for (const text of TITLE) {
                    let td = document.createElement('th');
                    td.textContent = text;
                    tr.appendChild(td);
                }
                idTab.appendChild(tr);
                title = 0
            }
            let tr = document.createElement('tr');
            let td = document.createElement('td');
            let button = document.createElement('button');
            button.textContent = com.path;
            button.addEventListener('click', (e) => {
                stop(com.path, tr);
            }, false)
            td.appendChild(button);
            tr.appendChild(td);
            idTab.appendChild(tr);

            start1(com, tr);
            await wait(1000);
        }
    })
}
function stop(com, tr) {
    console.log("stop " + com.path)
}


async function start1(com, tr) {
    tr.replaceChildren();
    try {
        let infoDingo = await dingoProcess(com, tr);
        console.log(infoDingo)
        console.log(serial)

    } catch (err) {
        //document.getElementById('error').textContent = err.message;
        let divErr = document.getElementById('error')
        let div = document.createElement('div');
        div.textContent = err.message;
        divErr.appendChild(div);
        console.log(err);
    };
}

async function dingoProcess(com, tr) {
    try {
        await openPort(com);
        await waitRedy(com);

        let res={error:true};
        for(let c=5; (c>0) && (res.error === true); --c )
        {
            res = await getDingoInfo(com);
            if(res.error === true) await wait(1000);
        }

        com.infoDingo = await parseDingoInitData(res.res);
        com.analyzes = [];

        let td = document.createElement('td');
        td.textContent = com.path;
        tr.appendChild(td);

        for (let i = 2; i < 4; i++) {
            td = document.createElement('td');
            td.textContent = com.infoDingo[i];
            tr.appendChild(td);
        }

        await waitRedy(com);

        td = document.createElement('td');
        td.style.border = "0px"
        td.style.padding = "0px"
        tr.appendChild(td);
        let tr1 = document.createElement('tr');
        let td1 = document.createElement('td');
        res = new Date();
        let date = res.toLocaleString('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric' });
        com.date = `${date.split(".").reverse().join("-")},${res.toLocaleTimeString()}`;// получить в том-же формате 
        td1.textContent = com.date;
        tr1.appendChild(td1);
        td.appendChild(tr1);

        res = await getTime(com)
        com.dateDingo = res;
        tr1 = document.createElement('tr');
        td1 = document.createElement('td');
        td1.textContent = res;
        tr1.appendChild(td1);
        td.appendChild(tr1);


        for (let i = 0; i < 12; i++) {
            console.log('i=' + i)
            //=====================================            
            td = document.createElement('td');
            tr.appendChild(td);
            let repit = 3;
            do {
                await waitRedy(com);
                res = await getAlcogol(com, td);
                switch (res.err) {
                    case 3:
                    case 2:
                        //td.textContent = res.analyzes;
                        repit = 0; i = 13; // этот динго сломан, отключаем
                        break
                    case 1:
                        if (--repit > 0) {
                            td.textContent = "Ошибка пробувки\nОст.повторов=" + (repit);
                        } else
                            td.textContent = res.analyzes;
                        break
                    case 4:
                        // эта музыка будет вечной
                        td.textContent = res.analyzes;
                        break
                    case 0:
                        td.textContent = res.analyzes;
                        repit = 0;
                        break
                    default:
                        td.textContent = "???????";
                        repit = 0; i = 13; // я не знаю что это
                        break;
                }
                // if (res.err) {
                //     if (--repit > 0) {
                //         td.textContent = "Ошибка пробувки\nОст.повторов=" + (repit);
                //     } else td.textContent = "Ошибка пробувки";
                // } else {
                //     td.textContent = res.analyzes;
                //     break
                // }
            } while (repit > 0)
            com.analyzes.push(td.textContent);
            await waitRedy(com);
            //await wait(3000);
            //=====================================

        }
        await deleteDingo(com)
        com.serialPort && com.serialPort.close();
        return com.infoDingo;
    } catch (err) {
        com.serialPort && com.serialPort.close();
        return (err);
    };
}

function defaultRead(data) {
    let str = data.toString('utf8').split('\n')
    //console.log('read: ', str)
};

function openPort(com) {
    return new Promise((resolve, reject) => {
        com.serialPort = new SerialPort({ path: com.path, baudRate: 115200 })
        com.parser = com.serialPort.pipe(new DelimiterParser({ delimiter: '\r\n' }))
        //com.parser = com.serialPort.pipe(new RegexParser({ regex: /[\r|:]+/ }))
        com.read = defaultRead;
        com.parser.on('data', (data) => com.read(data))
        com.serialPort.on('open', function () {
            resolve({});
        });
        com.serialPort.on('error', (err) => {
            console.log(`serial port ${com.path} error: ` + err);
            console.log(com)
        });
        com.serialPort.on('close', (err) => {
            console.log(`serial port ${com.path} close ` + err);
            com.serialPort = undefined
        });
        setTimeout(() => reject({ message: 'Ошибка при открытии порта: ' + com.path }), 12000)
    });
}

function waitRedy(com) {
    return new Promise((resolve, reject) => {
        com.read = (data) => {
            let str = data.toString('utf8').split('\n')
            console.log(`waitRedy(${com.path}): `, str)
            switch (str[0]) {
                case `$END`: {
                    com.read = defaultRead;
                    resolve(str);
                } break;
                default:
                    break;
            }
        };
    });
};

function parseDingoInitData(data) {
    return new Promise((resolve, reject) => {
        if (data.length == 10) {
            data[2] += data[3];
            data.splice(3, 1);
        }
        resolve(data);
    })
};

function getDingoInfo(com) {
    let res = [];
    return new Promise((resolve, reject) => {
        com.read = (data) => {
            //console.log(data);
            let str = data.toString('utf8').split('\n')
            console.log(`getDingoInfo(${com.path}):`, str)
            switch (str[0]) {
                case `$END`: {
                    if (res.length == 0) { break; }// если вдруг первым придёт $END то игнорим его
                    com.read = defaultRead;
                    if (res[2] == 'TANBY') resolve({ error: true, res: res });
                    //if (res[2] == 'ERIAL') resolve({ error: true, res: res });
                    resolve({ error: false, res: res });
                } break;
                // case `#i7`: {
                //     console.log(`#i7`, str);
                //     com.read = defaultRead;
                //     resolve(str);
                // } break;
                default:
                    res.push(...str);// объединяем массивы строк
                    break;
            }
        };
        com.serialPort.write("$i0000\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                setTimeout(() => reject({ message: 'Алкотестер не отвечает по ' + com.path }), 3000)
            }
        });
    });
};

function getAlcogol(com, td) {
    //console.log('start getAlcogol')
    return new Promise((resolve, reject) => {
        com.read = (data) => {
            let str = data.toString('utf8').split(/[\n|:]+/)
            console.log(`getAlcogol(${com.path}): `, str)
            switch (str[0]) {
                case '$WAIT': { td.textContent = 'ЖДИТЕ' } break;
                case '$STANBY': { td.textContent = 'ГОТОВ' } break;
                case '$BREATH': { td.textContent = 'АНАЛИЗ' } break;
                case '$CALIBRATION': { td.textContent = 'Требуется калибровка' } break;
                case '$MODULE,ERR': {
                    td.textContent = 'Неисправен модуль';
                    com.read = defaultRead;
                    resolve({ err: 3, analyzes: str });
                } break;
                case '$SENSOR,ERR': {
                    td.textContent = 'Ошибка сенсора, замените сенсор';
                    com.read = defaultRead;
                    resolve({ err: 2, analyzes: str });
                } break;
                case '$FLOW,ERR': {
                    td.textContent = 'Ошибка продувки';
                    com.read = defaultRead;
                    resolve({ err: 1, analyzes: str });
                } break;
                case '$TIME,OUT': {
                    td.textContent = 'Таймаут, да поебать!';
                    com.read = defaultRead;
                    resolve({ err: 4, analyzes: str });
                } break;
                case `$R`: {
                    console.log(`$R:`, str);
                    com.read = defaultRead;
                    resolve({ err: 0, analyzes: str[1].split(',')[0] });
                } break;
                default: // то чего неможет быть
                    console.log(`getAlcogol(${com.path}): `, str)
                    td.textContent = str;
                    break;
            }
        };
        console.log('send getAlcogol')
        com.serialPort.write("$STARTSENTECH\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                //setTimeout(() => reject({ message: 'Алкотестер не отвечает по ' + com.path }), 2000)
            }
        });
    });
};

function getTime(com) {
    return new Promise((resolve, reject) => {
        com.read = (data) => {
            let str = data.toString('utf8').split('\n')
            console.log(`getTime(${com.path}): `, str)
            switch (str[0][0]) {
                case '#': {
                    //console.log('#', str);
                    com.read = defaultRead;
                    resolve(str[0].slice(1)); // отбросить '#'
                } break;
                default:
                    break;
            }
        };
        com.serialPort.write("$RECALL\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                //setTimeout(() => reject({ message: 'Алкотестер не отвечает по ' + com.path }), 2000)
            }
        });
    });
};



function deleteDingo(com) {
    return new Promise((resolve, reject) => {
        com.serialPort.write("$U0000\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
