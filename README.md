# Pipe Dream

A port of the old pipe game from fallout/arcades; move the pipes to control the flow of liquid to the tanks. There are different liquids that belong to different tanks.


### Features 
- 100% vanilla HTML
- Level editor
- Level select
- Mobile support

## Technical

config: config.json
tile-types: These are the base card configs. 

    name: the name in the editor
    card_img: this name is used to look up images. GET THIS RIGHT
    moveable: able to be dragged
    rotatable: able to be rotated
    source: this is the string (color) of the flow [optional]
    io: This defines the interface of the card and defines the holes basically - [N, E, S, W] 1 or 0.

These base types can have decendants which can overwrite these attributes making variations easier, ex: the small tank

All tiles have thier own background and decal slots, as well as a slot for a card, which can live on a tile, which has it's own background and flow image.
Valid cards MUST have thier own directory with a main background image and flow svg. This flow image will have its fill attribute manipulated by the engine.


