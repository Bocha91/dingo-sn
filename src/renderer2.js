// SN Dingo E200-2.0.0
const { SerialPort } = require('serialport')
const { DelimiterParser } = require('@serialport/parser-delimiter')
//const { RegexParser } = require('@serialport/parser-regex')
const EventEmitter = require('events');

//const TITLE = ['порт', 'модель', 'SN', 'версия', 'поверка', 'калибровка', 'не считано', 'проведено анализов'];
const TITLE = ['порт', 'SN', 'версия', '№1', '№2', '№3', '№4', '№5', '№6', '№7', '№8', '№9', '№10', '№11', '№12'];
var serial;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

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

listSerialPorts()

async function listSerialPorts() {
    await SerialPort.list().then((ports, err) => {
        if (err) {
            document.getElementById('error').textContent = err.message
            return
        } else {
            document.getElementById('error').textContent = ''
        }
        console.log('ports', ports);
        //console.log(JSON.stringify(ports));

        if (ports.length === 0) {
            document.getElementById('error').textContent = 'Порты не обнаружены, Ctr+R просканить ещё'
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
        }
    })
}
function stop(com, tr) {
    console.log("stop " + com.path)
}


async function start1(com, tr) {
    tr.replaceChildren();
    try {
        let infoDingo = await dingoProcess(com);
        console.log(infoDingo)
        console.log(serial)
        let td = document.createElement('td');
        td.textContent = com.path;
        tr.appendChild(td);

        for (let i = 2; i < 4; i++) {
            td = document.createElement('td');
            td.textContent = com.infoDingo[i]; 
            tr.appendChild(td);
        }
        for (const analyzes of com.analyzes) {
            td = document.createElement('td');
            td.textContent = analyzes; 
            tr.appendChild(td);
        }
    } catch (err) {
        //document.getElementById('error').textContent = err.message;
        let divErr = document.getElementById('error')
        let div = document.createElement('div');
        div.textContent = err.message;
        divErr.appendChild(div);
        console.log(err);
    };
}

/*
function start(com
    //, tr
    ) {
    //tr.replaceChildren();
    reportInfo(com)
        .then((infoDingo) => {
            //console.log(infoDingo)
            console.log(serial)
            // let td = document.createElement('td');
            // td.textContent = path;
            // tr.appendChild(td);
            // for (let i = 1; i < infoDingo.length - 1; i++) {
            //     td = document.createElement('td');
            //     td.textContent = infoDingo[i];
            //     tr.appendChild(td);
            // }

        })
        .then({
        })
        .catch(err => {
            document.getElementById('error').textContent = err.message;
            console.log(err);
        });
}

function reportInfo(com) {
    return new Promise((resolve, reject) => {
        openPort(com)
            //.then(() => wait(3000))
            .then(() => getDingoInfo(com))
            .then(res => parseDingoInitData(res))
            .then(res => {
                com.infoDingo = res;
                return wait(5000);
            })
            .then(() => getAlcogol(com))
            .then(res => {
                if (res.err) {

                } else
                    com.analyzes = res;
                return wait(5000);
            })
            .then(() => deleteDingo(com))
            .then(() => {
                com.serialPort && com.serialPort.close();
                resolve(com.infoDingo);
            })
            .catch(err => {
                com.serialPort && com.serialPort.close();
                reject(err);
            });
    });
}
*/
async function dingoProcess(com) {
    try {
        await openPort(com);
        let res = await getDingoInfo(com);
        com.infoDingo = await parseDingoInitData(res);
        com.analyzes = [];
        //await wait(5000);
        res = await getAlcogol(com);
        if (res.err) {
            com.analyzes.push("Ошибка пробувки");
        } else{ 
            com.analyzes.push(res.analyzes);
        }
        await wait(5000);
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
    console.log('read: ', str)
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


async function getDingoInfo(com) {
    return new Promise((resolve, reject) => {
        com.read = (data) => {
            let str = data.toString('utf8').split('\n')
            console.log('getDingoInfo: ', str)
            switch (str[0]) {
                case `#i7`: {
                    console.log(`#i7`, str);
                    com.read = defaultRead;
                    resolve(str);
                } break;
                default:
                    break;
            }
        };
        com.serialPort.write("$i0000\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                setTimeout(() => reject({ message: 'Алкотестер не отвечает по ' + com.path }), 2000)
            }
        });
    });
};

function getAlcogol(com) {
    return new Promise((resolve, reject) => {
        com.read = (data) => {
            let str = data.toString('utf8').split(/[\n|:]+/)
            console.log('getAlcogol: ', str)
            switch (str[0]) {
                case `$WAIT`: { console.log(`$WAIT`, str) } break;
                case `$STANBY`: { console.log(`$STANBY`, str) } break;
                case `$BREATH`: { console.log(`$BREATH`, str) } break;
                case '$FLOW,ERR': {
                    console.log(`$FLOW,ERR`, str)
                    com.read = defaultRead;
                    resolve({ err: true, analyzes: str });
                } break;
                case `$R`: {
                    console.log(`$R:`, str);
                    com.read = defaultRead;
                    resolve({ err: false, analyzes: str[1].split(',')[0] });
                } break;
                default:
                    break;
            }
        };
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


/*
function getDingoInfo(com) {
    // com.read = (data)=>{
    //     let str = data.toString('utf8')
    //     let E200 = str.split( /[\r|:]+/ )
    //     console.log('getDingoInfo: ', E200)
    //     com.eventEmitter.emit(E200[0], E200);
    // };
    return new Promise((resolve, reject) => {
        com.serialPort.write("$i0000\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                com.eventEmitter.once(`#i7`, (analyzes) => {
                    console.log(`#i7`)
                    resolve(analyzes);
                });
                setTimeout(() => reject({ message: 'Алкотестер не отвечает по ' + com.path }), 2000)
            }
        });
    });
};


function getAlcogol(com) {
    com.read = (data) => {
        let str = data.toString('utf8')
        let E200 = str.split(/[\n|:]+/)
        console.log('getAlcogol: ', E200)
        com.eventEmitter.emit(E200[0], E200);
    };
    return new Promise((resolve, reject) => {
        com.serialPort.write("$STARTSENTECH\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                com.eventEmitter.on(`$WAIT`, (analyzes) => { console.log(`$WAIT`, analyzes) })
                com.eventEmitter.on(`$STANBY`, (analyzes) => { console.log(`$STANBY`, analyzes) })
                com.eventEmitter.on(`$BREATH`, (analyzes) => { console.log(`$BREATH`, analyzes) })
                com.eventEmitter.on('$FLOW,ERR', (analyzes) => {
                    console.log(`$FLOW,ERR`, analyzes)
                    resolve({ err: true, analyzes: analyzes });
                })

                com.eventEmitter.once(`$R`, (analyzes) => {
                    console.log(`$R:`, analyzes);
                    resolve({ err: false, analyzes: analyzes });
                });
                //setTimeout(() => reject({ message: 'Алкотестер не отвечает по ' + com.path }), 2000)
            }
        });
    });
};

*/


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
function parseDingoInitData(data) {
    return new Promise((resolve, reject) => {
        if (data.length == 10) {
            data[2] += data[3];
            data.splice(3, 1);
        }
        resolve(data);
    })
}