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
    return string.substr(0, index) + character + string.substr(index +
        character.length);
}

function start() {
    var startLoad = new Date;

    window.app = new SL.Game({
        canvas: document.getElementById('GameCanvas')
    });

    app.assetCollection = new SL.AssetCollection('res/assets.json', app,
        function() {
            /*_gaq.push(['_trackEvent', 'Game', 'Load', '', (new Date - startLoad) / 1000]);
		$('.canvas-container').append(domjs.build(templates.modal));
		moveModal();
		$(window).resize(function () {
		    moveModal();
		});*/

            var loadingScene = new SL.Scene('loading', [], function() {},
                app);

            loadingScene.addEntity(new SL.Loader({
                assetCollection: app.assetCollection,
                screenSize: SCREEN_SIZE,
                loadCallback: function() {
                    app.transitionScene('game');
                },
                barColor: 'blue',
                textColor: 'green'
            }));

            var gameScene = new SL.Scene('game', [], function() {
                /*var modal = $('.modal');
			modal.empty();
			modal.off();
			modal.hide();*/

                app.currentScene.addEntity({
                    type: 'background',
                    sprite: new PIXI.Sprite(app.assetCollection
                        .getTexture('background')),
                    update: function() {
						while (app.currentScene.getEntitiesByTag('food').length < 5) {
							app.currentScene.addEntity(new Food({
								position: new SCREEN_SIZE.clone().randomize()
							}));
						}
					}
                });

                while (app.currentScene.getEntitiesByTag('food').length < 5) {
                    app.currentScene.addEntity(new Food({
                        position: new SCREEN_SIZE.clone().randomize()
                    }));
                }

				for (var i = 0; i < 15; i++) {
					app.currentScene.addEntity(new Creature({
						position: new SCREEN_SIZE.clone().randomize(),
						inputs: [
							'radarFood'
						],
						logicCircuit: seedCircuit({
							inputs: 4,
							outputs: 4,
							genomeLength: 64
						})
					}))
				}

				app.currentScene.addEntity(new Evolver());
            }, app);

            app.addScene(loadingScene);
            app.addScene(gameScene);
            app.transitionScene('loading');

            app.start();
        });
}

function Creature(config) {
    var me = this;

    me.tag = 'creature';
	me.health = 10;
	me.score = 0;
    me.sprite = new PIXI.Sprite(app.assetCollection.getTexture(me.tag));
    me.sprite.anchor.x = 0.5;
    me.sprite.anchor.y = 0.5;
    me.sprite.position = config.position;
    me.sprite.rotation = 0;

    me.inputs = config.inputs;

    me.logicCircuit = config.logicCircuit;

    me.update = function() {
        var controlOutput, food,
            inputFound = false,
            moveX = 0,
            moveY = 0;

		if (me.health >= 0) {
			me.logicCircuit.input = parseInput();
			food = app.currentScene.getEntitiesByTag('food');

			controlOutput = me.logicCircuit.resolve();

			if (controlOutput[0]) {
				me.sprite.position.x += 125 * app.deltaTime;
                moveX += 125;
			}
			if (controlOutput[1]) {
				me.sprite.position.x -= 125 * app.deltaTime;
                moveX -= 125;
			}
			if (controlOutput[2]) {
				me.sprite.position.y += 125 * app.deltaTime;
                moveY += 125;
			}
			if (controlOutput[3]) {
				me.sprite.position.y -= 125 * app.deltaTime;
                moveY -= 125;
			}

            if (me.sprite.position.x < 0) {
				me.sprite.position.x = SCREEN_SIZE.x;
			}
            if (me.sprite.position.x > SCREEN_SIZE.x) {
				me.sprite.position.x = 0;
			}
            if (me.sprite.position.y < 0) {
				me.sprite.position.y = SCREEN_SIZE.y;
			}
            if (me.sprite.position.y > SCREEN_SIZE.y) {
				me.sprite.position.y = 0;
			}

			me.health -= app.deltaTime;

			for (var i = 0; i < food.length; i ++) {
				if (me.sprite.position.distance(food[i].sprite.position) <= 15) {
					me.health += 10;
					food[i].eaten = true;
					me.score += 500;
				}
			}

            if (moveX === 0 && moveY === 0) {
                me.health = 0;
                me.score = 0;
            }

			me.score += 1;
		}
    }

    function parseInput() {
        var input = [],
            food = app.currentScene.getEntitiesByTag('food'),
            closestFood = food[0];

        for (var i = 0; i < me.inputs.length; i++) {
            if (me.inputs[i] === 'radarFood') {
                for (var i2 = 1; i2 < food.length; i2++) {
                    if (me.sprite.position.distance(food[i2].sprite.position) <
                        me.sprite.position.distance(closestFood.sprite.position)) {
						closestFood = food[i2];
                    }
                }

                if (me.sprite.position.x > closestFood.sprite.position.x) {
                    input.push(0, 1);
                } else {
                    input.push(1, 0);
                }
                if (me.sprite.position.y > closestFood.sprite.position.y) {
                    input.push(0, 1);
                } else {
                    input.push(1, 0);
                }
            } else if (me.inputs[i] === 'radarEdge') {
				if (me.sprite.position.x <= 15) {
					input.push(1);
				} else {
					input.push(0);
				}
				if (me.sprite.position.x >= SCREEN_SIZE.x - 15) {
					input.push(1);
				} else {
					input.push(0);
				}
				if (me.sprite.position.y <= 15) {
					input.push(1);
				} else {
					input.push(0);
				}
				if (me.sprite.position.y >= SCREEN_SIZE.y - 15) {
					input.push(1);
				} else {
					input.push(0);
				}
            }
        }

        return input;
    }
}

function Food(config) {
    var me = this;

    me.tag = 'food';
    me.sprite = new PIXI.Sprite(app.assetCollection.getTexture(me.tag));
    me.sprite.anchor.x = 0.5;
    me.sprite.anchor.y = 0.5;
    me.sprite.position = config.position;
    me.sprite.rotation = 0;

	me.eaten = false;

    me.update = function() {
		if (me.eaten) {
			app.currentScene.removeEntity(me);
		}
    }
}

function LogicGate(config) {
    var me = this;

    me.tag = 'gate';
    me.type = config.type;
    me.sources = [];
    me.circuit = config.circuit;
    me.circuitIndex = config.circuitIndex;

    me.out = 0;

    me.resolve = function() {
        var a = me.sources[0].tag === 'gate' ? me.sources[0].out : me.circuit
            .input[me.sources[0]],
            b = me.sources[1].tag === 'gate' ? me.sources[1].out : me.circuit
            .input[me.sources[1]];

        switch (me.type) {
            case 'AND':
                me.out = (a && b) ? 1 : 0;
                break;
            case 'OR':
                me.out = (a || b) ? 1 : 0;
                break;
            case 'NOT':
                me.out = (!a) ? 1 : 0;
                break;
            case 'NAND':
                me.out = !(a && b) ? 1 : 0;
                break;
            case 'NOR':
                me.out = (!a && !b) ? 1 : 0;
                break;
            case 'XOR':
                me.out = ((a || b) && !(a && b)) ? 1 : 0;
                break;
            default:
                me.out = 0;
                break;
        }
    }
}

function LogicCircuit(genome) {
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
    me.input = [];
    me.outputs = [];

    for (var i = 0; i < me.genome.length; i++) {
        me.gates.push(
            new LogicGate({
                type: me.gateTypes[parseInt(me.genome[i])],
                circuit: me,
                circuitIndex: i
            })
        );
    }

    me.addOutput = function(index) {
        me.outputs.push(me.gates[index]);
    }

    me.setOutputs = function(indices) {
        me.outputs = [];
        for (var i = 0; i < indices.length; i++) {
            me.outputs.push(me.gates[indices[i]]);
        }
    }

    me.resolve = function(input) {
        var output = [],
            gateVal;

        me.input = input ? input : me.input;

        for (i = 0; i < me.gates.length; i++) {
            me.gates[i].resolve();
        }

        for (i = 0; i < me.outputs.length; i++) {
            output.push(me.outputs[i].out);
        }

        return output;
    }
}

function seedCircuit(config) {
    var inputs = config.inputs,
        outputs = config.outputs,
        genomeLength = config.genomeLength,
		genome = '',
        usedOutputs = {},
        validGateFound = false,
        rnd, circuit;

	for (var i = 0; i < genomeLength; i++) {
		genome += Math.floor(Math.random() * 6);
	}

	circuit = new LogicCircuit(genome);

    for (var i = 0; i < inputs; i++) {
        while (!validGateFound) {
            rnd = Math.floor(Math.random() * genomeLength);

            if (!circuit.gates[rnd].sources[0]) {
                circuit.gates[rnd].sources[0] = i;
                validGateFound = true;
            }
        }
        validGateFound = false;

        circuit.input.push(0);
    }

    for (i = 0; i < outputs; i++) {
        while (!validGateFound) {
            rnd = Math.floor(Math.random() * genomeLength);

            if (!usedOutputs[rnd]) {
                circuit.addOutput(rnd);
                usedOutputs[rnd] = true;
                validGateFound = true;
            }
        }
        validGateFound = false;
    }

    for (i = 0; i < genomeLength; i++) {
        while (!circuit.gates[i].sources[0]) {
            rnd = Math.floor(Math.random() * genomeLength);

            if (rnd !== i) {
                circuit.gates[i].sources[0] = circuit.gates[rnd];
            }
        }
        while (!circuit.gates[i].sources[1]) {
            rnd = Math.floor(Math.random() * genomeLength);

            if (rnd !== i) {
                circuit.gates[i].sources[1] = circuit.gates[rnd];
            }
        }
    }

    return circuit;
}

function Evolver() {
    var me = this;

    me.generation = 0;
    me.mutationRate = 0.01;
    me.generationalRate = 0.2;
    me.lastBestCreature = app.currentScene.getEntitiesByTag('creature')[0];
    me.lastBestFitness = 0;
    me.gateTypes = [
        'AND',
        'OR',
        'NOT',
        'NAND',
        'NOR',
        'XOR'
    ];

    me.update = function() {
        var creatures = app.currentScene.getEntitiesByTag('creature');

        for (var i = 0; i < creatures.length; i++) {
            if (creatures[i].health <= 0) {
                if (Math.random() <= me.generationalRate) {
                    creatures[i].logicCircuit = seedCircuit({
                        inputs: 4,
                        outputs: 4,
                        genomeLength: 64
                    });
                    creatures[i].sprite.position = SCREEN_SIZE.clone().randomize();
                    me.generation++;
                } else {
                    me.mutateCreature(creatures[i]);
                }
            }

			if (creatures[i].score > me.lastBestFitness) {
				me.lastBestFitness = creatures[i].score;
				me.lastBestGenome = creatures[i].logicCircuit.genome;
			}
        }
    }

    me.mutateCreature = function(creature) {
        var baseCircuit = me.lastBestCreature.logicCircuit,
            mutateCircuit = creature.logicCircuit;

        for (var i = 0; i < baseCircuit.gates.length; i++) {
            mutateCircuit.gates[i].type = baseCircuit.gates[i].type;

            mutateCircuit.gates[i].sources[0] = baseCircuit.gates[i].sources[0].tag === 'gate' ?
                mutateCircuit.gates[baseCircuit.gates[i].sources[0].circuitIndex] :
                baseCircuit.gates[i].sources[0];
            mutateCircuit.gates[i].sources[1] = baseCircuit.gates[i].sources[1].tag === 'gate' ?
                mutateCircuit.gates[baseCircuit.gates[i].sources[1].circuitIndex] :
                baseCircuit.gates[i].sources[1];
        }

        for (i = 0; i < mutateCircuit.gates.length; i++) {
            if (Math.random() <= me.mutationRate) {
                mutateCircuit.gates[i].type = me.gateTypes[Math.floor(Math.random() * 6)]
            }
            if (Math.random() <= me.mutationRate) {
                if (Math.random() <= 0.5) {
                    mutateCircuit.gates[i].sources[0] = Math.floor(Math.random() * mutateCircuit.input.length);
                } else {
                    mutateCircuit.gates[i].sources[0] = mutateCircuit.gates[Math.floor(Math.random() * mutateCircuit.gates.length)];
                }
            }
            if (Math.random() <= me.mutationRate) {
                if (Math.random() <= 0.5) {
                    mutateCircuit.gates[i].sources[1] = Math.floor(Math.random() * mutateCircuit.input.length);
                } else {
                    mutateCircuit.gates[i].sources[1] = mutateCircuit.gates[Math.floor(Math.random() * mutateCircuit.gates.length)];
                }
            }
        }

        creature.health = 10;
        creature.score = 0;
        creature.sprite.position = SCREEN_SIZE.clone().randomize();
    }
}
