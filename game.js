SL = sugarLab;

var SCREEN_SIZE = new SL.Vec2(800, 600);

function logPlay() {
    _gaq.push(['_trackEvent', 'Button', 'Play']);
}

function moveModal() {
    var $modal = $('.modal'),
        gameOffset = $(app.canvas).offset();

        $modal.offset({
            top: gameOffset.top - 5,
            left: gameOffset.left - 5
        });
}

function replaceAt(string, index, character) {
    return string.substr(0, index) + character + string.substr(index+character.length);
}

function start() {
    var startLoad = new Date;

    window.app = new SL.Game({canvas: document.getElementById('GameCanvas')});

    app.assetCollection = new SL.AssetCollection('res/assets.json', app, function () {
        _gaq.push(['_trackEvent', 'Game', 'Load', '', (new Date - startLoad) / 1000]);
        $('.canvas-container').append(domjs.build(templates.modal));
        moveModal();
        $(window).resize(function () {
            moveModal();
        });

        var loadingScene = new SL.Scene('loading', [], function () {
        }, app);

        loadingScene.addEntity(new SL.Loader({
            assetCollection: app.assetCollection,
            screenSize: SCREEN_SIZE,
            loadCallback: function () { app.transitionScene('game'); },
            barColor: 'blue',
            textColor: 'green'
        }));

        var gameScene = new SL.Scene('game', [], function () {
            var modal = $('.modal');
            modal.empty();
            modal.off();
            modal.hide();

            app.currentScene.addEntity({
                type: 'background',
                sprite: new PIXI.Sprite(app.assetCollection.getTexture('background')),
                update: function () {}
            });
            app.currentScene.addEntity(new Evolver());
        }, app);

        app.addScene(loadingScene);
        app.addScene(gameScene);
        app.transitionScene('loading');

        app.start();
    });
}

function LogicGate (type) {
    var me = this;

    me.type = type;
    me.in = [
        0,
        0
    ];

    me.resolve = function () {
        var a = me.in[0],
            b = me.in[1];

        switch (me.type) {
            case 'AND':
                return (a && b) ? 1 : 0;
                break;
            case 'OR':
                return (a || b) ? 1 : 0;
                break;
            case 'NOT':
                return (!a) ? 1 : 0;
                break;
            case 'NAND':
                return !(a && b) ? 1 : 0;
                break;
            case 'NOR':
                return (!a && !b) ? 1 : 0;
                break;
            case 'XOR':
                return ((a || b) && !(a && b)) ? 1 : 0;
                break;
            default:
                break;
        }
    }
}

function LogicCircuit (genome) {
    var me = this;

    me.genome = genome;
    me.gates = [];
    me.gateTypes = [
        'AND',
        'OR',
        'NOT',
        'NAND',
        'NOR',
        'XOR'
    ];

    for (var i = 0; i < me.genome.length; i++) {
        me.gates.push(
            new LogicGate(
                me.gateTypes[parseInt(me.genome[i])]));
    }

    me.resolve = function (input) {
        var output = [],
            gateVal;

        for (i = 0; i < me.gates.length; i++) {
            if (i < 10) {
                me.gates[i].in = input[i];
            }

            gateVal = me.gates[i].resolve();

            if (me.gates[i + 10]) {
                me.gates[i + 10].in[0] = gateVal;
            } else {
                output.push(gateVal);
            }
            if (me.gates[i + 11]) {
                me.gates[i + 11].in[1] = gateVal;
            }
        }

        return output;
    }
}

function Evolver () {
    var me = this;

    me.data = [[[1, 0],[0, 0],[1, 1],[0, 1],[1, 1],[1, 1],[1, 0],[0, 0],[0, 0],[0, 1]],
        [[1, 1],[1, 0],[1, 1],[0, 0],[1, 1],[0, 1],[1, 1],[0, 0],[1, 1],[1, 1]]];
    me.expects = [1, 0];
    me.generation = 0;
    me.mutationRate = 0.01;
    me.generationSize = 100;
    me.lastBestGenome = '0112115320014113121231154123121354151321003511541123132045211231451232005141541321315205111424510315';
    me.lastBestFitness = 1;

    me.update = function () {
        var circuits = [],
            currentBestFitness = me.lastBestFitness,
            currentBestGenome = me.lastBestGenome,
            results = [0, 0];

        if (me.lastBestFitness !== 0) {
            for (var i = 0; i < me.generationSize; i++) {
                circuits.push(new LogicCircuit(me.generateGenome()));
                results[0] = circuits[i].resolve(me.data[0]);
                results[1] = circuits[i].resolve(me.data[1]);

                if (me.findFitness(results) < me.lastBestFitness) {
                    currentBestFitness = me.findFitness(results);
                    currentBestGenome = circuits[i].genome;
                }
            }

            me.lastBestFitness = currentBestFitness;
            me.lastBestGenome = currentBestGenome;
            me.generation++;
            console.log(me.generation, me.lastBestFitness, me.lastBestGenome);
        }
    }

    me.findFitness = function (results) {
        var distance = [],
            average = 0;

            for (var i = 0; i < results[0].length; i++) {
                average += results[0][i];
            }
            distance.push(Math.abs((average / results[0].length) - me.expects[0]));
            average = 0;

            for (i = 0; i < results[1].length; i++) {
                average += results[1][i];
            }
            distance.push(Math.abs((average / results[1].length) - me.expects[1]));

            return (distance[0] + distance[1]) / 2;
    }

    me.generateGenome = function () {
        var newGenome = me.lastBestGenome;

        for (var i = 0; i < 100; i++) {
            if (Math.random() <= me.mutationRate) {
                newGenome = replaceAt(newGenome, i, Math.floor(Math.random() * 6).toString());
            }
        }

        return newGenome;
    }
}
