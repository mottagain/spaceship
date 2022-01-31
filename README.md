# spaceship
A Galaga-like game for fun.

# TODO
* Enable 2p
  - Bug:  Deaths are not tracked against the correct player
  - Bug:  Input for player 1 controls player 2 when player 1 is dead
  - Bug:  The HUD doesn't remember which side a players' score / extra lives belong on.  So when player 1 dies, player 2's stats move to the left.
* Scoreboard
* Enemy waves system
* Rotate circle enemy
* Split engine from systems and components
* Add ComponentManager overlaods to work with Singleton components
* Allow multiple of the same component, so multiple impulses or collisions could be added
