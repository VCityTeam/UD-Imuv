# Features IMUV

## Exhibition

- Exhibition room :

  - Possibility to place pictures on the wall of the room.
  - Follow the exhibition guided (with next / previous button) or freely by moving in the 3D world

- The Island:
  - Possibility to place the interactive panels in the island
  - Link media to the panels (photos / videos / audios / website)

## Communication

- Conference room :

  - Conference room with a large screen allowing for audio / video / text / screen sharing communication tool.

- Communication areas:
  - You can meet in several places in the island and rooms to discuss with other users present in the island.

## Work

- Studios:
  - The studios are workrooms. Access to chat and a collaborative whiteboard.

## Model

- 3D model :
  - Lyon in 3D model
  - Walk around the model (with the 3D avatar)
  - Use the data visualization features of Itowns and UD-Viz :
    - Top-view
    - Interaction wigdets

## Example of use

- Before join the world

```mermaid
flowchart
user((User)) --> browser[Open a browser]
browser --> imuvHttps[Write https://www.imuvirtuel.fr in the link bar]
imuvHttps --> account[Create an account]
account --> login[Login]
imuvHttps --> login
login -->|if admin| editor[Open editor]
editor --> edit[Edit and save modifications]
edit --> closeEditor[Close editor]
closeEditor --> join
login --> join[Join the world]
imuvHttps -->|as guest| join
```

- In Game

```mermaid
flowchart TB
user((User)) --> asGuest[\As guest/]
user((User)) --> asOther[\As user or admin/]
asOther --> avatarMenu[Open the menu avatar]
avatarMenu --> editAvatar[Edit the avatar : change color, chose a model, change the face image]
editAvatar --> closeEditAvatar[Save modifications and close the menu avatar]
asGuest ----> visitFC{Visit the Flying Campus}
asOther -------> visitFC
visitFC -->|with dbclick| signBoard[Interact with the signboards]
visitFC --> jumpCity[Jump in the city]
visitFC --> zeppelinTour[Take a zeppelin tour]
visitFC ---> exhibit[Go to the exhibit room]
visitFC ---> conference[Go to the conference room]
visitFC ----> studios[Go to the studios]
visitFC ----> mapFeatures(Use map features)
visitFC --> vizview(Use urban data vizualition features)
vizview --> itowns[Itowns' camera control]
vizview --> widgets[UD-Viz widgets]
zeppelinTour --> visitSky[See the city from the sky]
exhibit --> tourImages[Follow the exhibition with the image tour]
conference --> screen[Participate in a videoconference thanks to the giant screen]
studios --> work[Work in collaboration with the tools available]
studios --> openMedia[Open different medias]
mapFeatures --> teleport[Teleport your avatar]
mapFeatures --> ping[Ping on the map]
jumpCity --> visitCity[Visit the city with the avatar]
visitCity -->|return on the island| visitFC
visitCity -->mapFeatures
```
