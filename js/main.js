'use strict';

/* 1. show map using Leaflet library. (L comes from the Leaflet library) */

const map = L.map('map', {tap: false});
L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
}).addTo(map);
map.setView([60, 24], 7);


//Global var
const apiURL = 'http://127.0.0.1:5000';
const blueIcon = L.divIcon({className: 'blue-icon'});
const greenIcon = L.divIcon({className: 'green-icon'});

const question = document.getElementById('game-question');
const options = document.getElementById('options');
const day_input = document.getElementById('day-input-form');
const day_input_text = document.getElementById('day-input-text');
const day_result = document.getElementById('day-result');
const af = document.getElementById('af');
const as = document.getElementById('as');
const oc = document.getElementById('oc');
const sa = document.getElementById('sa');
const fi = document.getElementById('fi');
const sprite = document.getElementById('sprite');


// function to fetch data from API
async function getData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Invalid server input!');
    const data = await response.json();
    console.log(data);
    return data;
}

function updateStatus(player) {
    document.querySelector('.stt').innerHTML = '';
    document.getElementById('player-name').innerHTML= `Player: ${player.name}`;
    document.getElementById('balance').innerHTML= player.balance;
    document.getElementById('day-total').innerHTML= '';
    document.getElementById('day-total').innerHTML= player.day;
    document.getElementById('money-spent').innerHTML= player.cost;
    document.getElementById('current-loc').innerHTML= `${player.location.city}, ${player.location.country}`;

    const marker = L.marker([player.location.lat, player.location.lon]).addTo(map);
    marker.setIcon(greenIcon);
    marker.bindPopup(`<b>${player.location.airport}, ${player.location.city}, ${player.location.country}</b>`);
    marker.openPopup();
}

async function get3options(player, cont) {
    question.innerHTML= ''
    question.innerHTML= `<p>Alisa is now at ${player.location.airport}, checking flight tickets to next destination...</p>`;
    options.innerHTML = '';
    const options_data = await getData(`${apiURL}/random?cont=${cont}&loc=${player.location.icao}`);
    //console.log(options_data);
    for (let i=0; i<3; i++) {
        const choice = document.createElement('div');
        choice.classList.add('box');
        choice.id = `choice-${i+1}`;
        choice.innerHTML = `<b>${options_data[i].city}, ${options_data[i].country}</b><br>Ticket price ${options_data[i].ticket}€. Salary ${options_data[i].earn}€ per day.`;
        options.appendChild(choice);

        const marker = L.marker([options_data[i].lat, options_data[i].lon]).addTo(map);
        marker.setIcon(blueIcon);
        marker.bindPopup(`${options_data[i].airport}, ${options_data[i].city}, ${options_data[i].country}`);



        choice.addEventListener('click', function() {
            day_result.innerHTML= '';
            question.innerHTML= '';
            if (player.balance < options_data[i].ticket) {
                const p_earn = Math.ceil(player.salary / 2);
                const p_day = Math.ceil(Math.abs(player.balance-options_data[i].ticket)/p_earn);
                player.day += p_day;
                player.balance += p_earn*p_day;
                question.innerHTML= `Alisa doesn't have enough money in her balance to afford that ticket. She has to stay 
                in ${player.location.city} for ${p_day} more days and work for only ${p_earn}€ per day. She earns ${p_earn*p_day}€
                ${p_day} days later and flies off to ${options_data[i].city}.`

            }
            const polyline = L.polyline([[player.location.lat, player.location.lon], [options_data[i].lat, options_data[i].lon]], {color: 'red'}).addTo(map);
            map.fitBounds(polyline.getBounds());

            player.balance -= options_data[i].ticket;
            player.salary = options_data[i].earn;
            player.cost += options_data[i].ticket;
            player.location.icao = options_data[i].icao;
            player.location.airport = options_data[i].airport;
            player.location.city = options_data[i].city;
            player.location.country = options_data[i].country;
            player.location.lat = options_data[i].lat;
            player.location.lon = options_data[i].lon;

            updateStatus(player);

            day_input_text.innerHTML= `How many days does Alisa want to stay in ${player.location.city}?`;
            day_input.addEventListener('submit', function(evt) {
                evt.preventDefault();
                question.innerHTML= '';
                const day_input_value = parseInt(document.getElementById('day-input-value').value);
                player.balance += player.salary*day_input_value;
                player.day += day_input_value;
                day_result.innerHTML = `After ${day_input_value} days, Alisa earns ${player.salary*day_input_value}€!`

                updateStatus(player);

            }, {once: true})

        })
    }
}




// form for player name
document.getElementById('player-form').addEventListener('submit',  async function(evt) {
    evt.preventDefault();
    const playerName = document.getElementById('name-input').value;

    document.getElementById('player-modal').classList.add('hide');

    const start_loc = await getData(`${apiURL}/icaoinfo/efhk`);
    //console.log(start_loc);
    let player = {};
    player.name = playerName;
    player.balance = 600;
    player.salary = 0;
    player.day = 0;
    player.cost = 0;
    player.location = start_loc;
    //console.log(player);

    updateStatus(player);

    get3options(player, 'eu');
    af.addEventListener('click', async function() {
        get3options(player, 'af');
    }, {once: true})
    as.addEventListener('click', async function() {
        get3options(player, 'as');
    }, {once: true})
    oc.addEventListener('click', async function() {
        get3options(player, 'oc');
    }, {once: true})
    sa.addEventListener('click', async function() {
        get3options(player, 'sa');
    }, {once: true})
    fi.addEventListener('click', async function() {
        question.innerHTML= '';
        question.innerHTML= `Congratulations! Alisa gets home after ${player.day} days travelling around the world!`;

        sprite.src= "img/dance-infinite-loop.gif";

        const home = await getData(`${apiURL}/icaoinfo/efhk`);
        const polyline = L.polyline([[player.location.lat, player.location.lon], [home.lat, home.lon]], {color: 'red'}).addTo(map);
        map.fitBounds(polyline.getBounds());

        player.location = home;
        updateStatus(player);
    }, {once: true})
})


