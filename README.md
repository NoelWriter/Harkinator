# Harkinator 👨‍🌾🐻🌈💰

1. npm install in root directory
2. Install the firefox driver https://github.com/mozilla/geckodriver/releases
3. Craete a config.json file and fill in the preferred settings. There are examples in the config directory.
4. Copy auth.json.example to your own created auth.json and put in your credentials.
5. Boot the script with one of the following commands.
- `npm start or node src/main.js 0`
- `sh start.sh (for multiple accounts)`
6. ???
7. Profit

## Dashboard 
![image](https://user-images.githubusercontent.com/7000976/112220435-8bfa1380-8c26-11eb-807b-0295c5f241d0.png)

You can use the dashboard to switch seamlessly between config settings. Follow the steps below to install the dashboard.
1. Execute to following command in the root folder: `npm install`
2. Execute to following command in the root folder: `npm run pre-install`

Execute the command `npm run dashboard` to bootup the dashboard. The command will try open the dashboard in your default browser. If nothing happens you can go to http://localhost:8080. When the dashboard is ready you can switch between predefined settings. Click on the Save button below the page if you are ready to make some 💸.. You can add new .json files in the config directory if you want to add more stocks.

## Settings
Variables are explained below

#### STOCK_PRIMARY
Vul hier de naam van de stock in. Let op dit veld is hoofdlettergevoelig.

#### STOCK_FRACTION_DIGITS 
Cijfers achter de comma. Verschilt per stock.

#### STOCK_MULTIPLIER_ABOVE_SELL 
Multiplier voor inkoop prijs. Hoger is hogere inkoop prijs. 
Inkoop prijs berekening = verkoopprijs op website + (STOCK_MULTIPLIER_ABOVE_SELL * spread)

#### STOCK_AMOUNT
Hoeveelheid aandelen dat de bot per trade inkoopt

#### STOCK_PROFIT
Multiplier voor verkoop prijs. Hoger is hogere verkoop prijs.
Verkoop prijs berekening = aanschafprijs + (STOCK_PROFIT * spread)

#### STOCK_ROUND_TO_WHOLE
Toggle afronden naar heel getal (voor bitcoin)

#### STOCK_BUY_UPPER_LIMIT
Multiplier die bepaald hoeveel de prijs mag stijgen voordat buy order geannuleerd wordt.
Bij 0.1 mag de verkoopprijs 10% stijgen voordat de buy order wordt geannuleerd.

#### STOCK_BUY_LOWER_LIMIT
Multiplier die bepaald hoeveel de prijs mag dalen voordat buy order geannuleerd wordt.
Bij 0.1 mag de verkoopprijs 10% dalen voordat de buy order wordt geannuleerd.

#### STOCK_BUY_FILL_WAIT
Hoeveelheid miliseconden dat de bot moet wachten bij gedeeltelijke vulling van een order.
1000 = 1 sec

#### STOCK_SELL_UPPER_LIMIT
Multiplier die bapaald hoeveel de prijs mag stijgen voordat de bot in winst modus gaat.
Bij 0.1 mag de verkoopprijs 10% stijgen voordat de bot in winst modus gaat.

#### STOCK_SELL_LOWER_LIMIT_BREAK_EVEN
Multiplier die bapaald hoeveel de prijs mag dalen voordat de bot in winst break even modus gaat.
Bij 0.1 mag de verkoopprijs 10% dalen voordat de bot in break even modus gaat.

#### STOCK_SELL_LOWER_LIMIT_LOSS
Multiplier die bapaald hoeveel de prijs mag dalen voordat de bot in verlies modus gaat.
Bij 0.1 mag de verkoopprijs 10% dalen voordat de bot in verlies modus gaat.

#### STOCK_EVALUATE_DELTA_UP
Multiplier die bepaald hoeveel de prijs mag stijgen voordat sell order geupdate wordt.
Bij 0.1 mag de verkoopprijs 10% stijgen voordat de sell order wordt geupdate.

#### STOCK_EVALUATE_DELTA_DOWN
Multiplier die bepaald hoeveel de prijs mag dalen voordat sell order geupdate wordt.
Bij 0.1 mag de verkoopprijs 10% dalen voordat de sell order wordt geupdate.

#### STOCK_LOSS_MULTIPLIER
Multiplier voor verkoop prijs bij verlies modus. Hoger is hogere verkoop prijs.
Verkoop prijs berekening = verkoopprijs op website + (STOCK_PROFIT * spread)

#### STOCK_PROBE_AMOUNT
Hoeveelheid aandelen die de bot ordert bij de lag test

#### FREEFALL_INDICATOR
Mulitplier die bepaald hoeveel de prijs mag dalen tussen de initieele koopprijs bepaling en het moment van aankoop.
Bij 0.01 wordt de aankoop geannuleerd bij een dalen van meer dan 1%.

#### LAG_MAX_ORDER_DELAY
Hoeveelheid miliseconden waarbinnen de lag van het platform acceptabel is.
Bij 3000 wordt de bot tijdelijk gepauzeerd wanneer er meer dan 3 seconden vertraging is.
1000 = 1 sec

#### FORCE_CLOSE_OPEN_POSITIONS
Toggle het automatisch sluiten van openstaande posities bij het starten van een nieuwe trade.

#### DEMO_MODE
Het script zal draaien in de demo omgeving van Capital.

#### DEBUG
Toggle debug mode. Zichtbaar in console.

#### DISCORD_TOKEN 
Token van de discord bot voor het doorgeven van informatie over de capital bot.

#### DISCORD_USERID
Vul in je Discord user id zodat je via Discord op de hoogte blijft.

#### USERNAME
Vul in je Capital gebruikersnaam.

#### PASSWORD
Vul in je Capital wachtwoord.

