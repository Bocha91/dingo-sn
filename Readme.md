__SN Dingo E200-1.0.0__ - Сканирует наличие COM портов на компьютере и выводит табличку с кнопками. Нажимая на кнопку Вы даёте команду на получение информации SN,... с этого порта. По завершении выводится информация в строке с нажатой кнопкой, а Динго отключается. Так сделал чтобы было понятно с какого динго считаны данные. 
А вот если COM порт не от Динго, то эта строчка с кнопкой из списка удаляется.

__SN Dingo E200-2.0.0__ - Сканирует наличие COM портов на компьютере. Запрашивает информация с подключенного Динго  и если получает ответ, то переводит Динго в режим продувки (для 12 продувок). После каждой продувки задержка 15сек. Выводит в табличку полученные данные о SN, версии прошивки и 12 продувках. По завершении 12 продувок Динго отключается. После отключения всех обнаруженных Динго собранная информация заносится в файл с именем "Dingo.cvs". Это имя можно изменить в поле "Имя файла".
Есть большая красная кнопка "СТОП" нажатие которой прерывает цикл ожидания 12 продувок и отключает все Динго?


Вставил клеточку с полученным от Динго временем.
Но, поскольку момент запроса времени для каждого Динго может отличаться на несколько секунд, для пущего удобства ещё и системного времени в момент запроса . Печатаю их в одной клеточке, сверху системное, под ним полученное от Динго. 


Обработка не штатных сообщений? сделал так:
'TIME,OUT' - бесконечно перезапускается процедура анализа, в журнале не отражается
'CALIBRATION' - просто выводится надпись "требуется калибровка", в журнале не отражается, работа продолжается
'SENSOR,ERR' и  'MODULE,ERR' - выводится соответствующая надпись и она-же загостится в журнал, работа с этим динго прекращается
'FLOW,ERR' - выводится надпись "Ошибка продувки, осталось попыток-N", а журнале не отмечается, ограничено 3 ошибками, если все три то работа с этим динго прекращается 



Чтобы собрать версию __SN Dingo E200-1.0.0__ надо в index.html  разкомментировать строчку <script src="./renderer1.js"></script> и закомментировать строчка <script src="./renderer2.js"></script>. Чтобы собрать версию __SN Dingo E200-2.0.0__ соответственно наоборот.
ВАЖНО: в package.json надо поставить соответственно версии 1.0.0 или 2.0.0

---

У мення сейчас Electron Forge v6.0.0 и serialport 10.5.0
Как создал
```
npm init electron-app@latest dingo-sn -- --template=webpack
npm i serialport
```
пример использования serialport: https://github.com/serialport/electron-serialport

запустить с отладкой
`npm start`

 создаёт установочный файл
`npm run make` 