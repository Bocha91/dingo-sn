// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { SerialPort } = require('serialport')
const { DelimiterParser } = require('@serialport/parser-delimiter')
const EventEmitter = require('events');




const TITLE = ['порт', 'модель', 'SN', 'версия', 'поверка', 'калибровка', 'не считано', 'проведено анализов'];
var port;
var eventEmitter = new EventEmitter();


async function listSerialPorts() {
    await SerialPort.list().then((ports, err) => {
        if (err) {
            document.getElementById('error').textContent = err.message
            return
        } else {
            document.getElementById('error').textContent = ''
        }
        console.log('ports', ports);

        if (ports.length === 0) {
            document.getElementById('error').textContent = 'Порты не обнаружены, Ctr+R просканить ещё'
        }

        let idPort = document.getElementById('ports');
        idPort.replaceChildren();
        if(ports.length == 0) return;
        let idTab = document.createElement('table');
        idPort.appendChild(idTab);

        let title = true;
        for (const com of ports) {
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
                getInfo(com.path, tr);
            }, false)
            td.appendChild(button);
            tr.appendChild(td);
            idTab.appendChild(tr);
        }
    })
}
function listPorts() {
    listSerialPorts();
    setTimeout(listPorts, 20000);
}

// Set a timeout that will check for new serialPorts every 2 seconds.
// This timeout reschedules itself.
//setTimeout(listPorts, 2000);

listSerialPorts()


const com = {
    friendlyName: "Устройство с последовательным интерфейсом USB (COM18)",
    locationId: "Port_#0001.Hub_#0009",
    manufacturer: "Корпорация Майкрософт",
    path: "COM18",
    pnpId: "USB\\VID_0483&PID_5740\\48EC604A3232",
    productId: "5740",
    serialNumber: "48EC604A3232",
    vendorId: "0483"
}

function getInfo(path, tr) {
    tr.replaceChildren();
    report(path)
        .then((urinoAnalyzes) => {
            console.log(urinoAnalyzes)
            let td = document.createElement('td');
            td.textContent = path;
            tr.appendChild(td);
            for(let i=1; i<urinoAnalyzes.length-1;i++){
                td = document.createElement('td');
                td.textContent = urinoAnalyzes[i];
                tr.appendChild(td);
            }
        })
        .catch(err => {
            document.getElementById('error').textContent = err.message;
            console.log(err);
        });
}

function report(path) {
    var urinoAnalyzes
    return new Promise((resolve, reject) => {
        UrinoInit(path)
            .then(() => getUrinoAnalyzes())
            .then(res => {
                urinoAnalyzes = parseUrinoData(res);
                return deleteUrinoResearches();
            })
            .then(() => {
                port && port.close();
                resolve(urinoAnalyzes);
            })
            .catch(err => {
                reject(err);
                port && port.close();
            });
    });
}

function UrinoInit(com) {
    console.log(com)
    return new Promise((resolve, reject) => {
        //urinodev = { path: com };
        openPort({ path: com })
            .then(serialPort => {
                port = serialPort;
                resolve({});
            })
            .catch(err => {
                console.log("open ", err)
                reject(err);
            })
    });
}

function openPort(urinodev) {
    console.log(urinodev)
    return new Promise((resolve, reject) => {
        var serialPort = new SerialPort({ path: urinodev.path, baudRate: 115200 })
        const parser = serialPort.pipe(new DelimiterParser({ delimiter: '$END\r\n' }))
        parser.on('data', (data) => {
            let str = data.toString('utf8')
            console.log('indata: ', str)
            let E200 = str.split('\n')
            console.log('E200: ', E200)
            eventEmitter.emit(E200[0], E200);
        });
        serialPort.on('open', function () {
            resolve(serialPort);
        });
        serialPort.on('error', (err) => {
            console.log('serial port error: ' + err);
        });
        setTimeout(() => reject({message:'Ошибка при открытии порта: ' + urinodev.path}), 2000)
    });
}


function getUrinoAnalyzes() {
    const getAnalyzesCommand = 0x04;
    return new Promise((resolve, reject) => {
        port.write("$i0000\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                eventEmitter.once(`#i7`, (analyzes) => {
                    resolve(analyzes);
                });
                setTimeout(() => reject({message:'Алкотестер не отвечает'}), 2000)
            }
        });
    });
};
function deleteUrinoResearches() {
    return new Promise((resolve, reject) => {
        port.write("$U0000\r\n", err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
function parseUrinoData(data) {
    if(data.length==10)
    {
        data[2]+=data[3];
        data.splice(3,1);
    }
    console.log(data.length)
    return data
}