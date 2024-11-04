# PollyGraph 🦜📈

This is a javascript code to enable a accesible way to keyboard traverse a non-directed graph.

It aims to be useful to everybody, but it has been designed to have in mind vision impairment using VoiceOver or similar text to voice HTML readers using `aria` tags as exposed in https://www.w3.org/TR/html-aria/


## Traversing general concepts

It relies on HTML focus in one single graph element, being those elements **nodes** and **links**.

- You start with one selected element and can change focus to another one using keyboard arrows or mouse-clicking on another element.
- The path with the history of your past selections is stored to go back in time in order to change your traversing and continue through new paths.
- Once you set the focus in a node, you can change focus to any link pointing out from it.
- Being in a node, once you set the focus in an outbound link, the original node and the rest of outbound links are shown in a different visual way, letting you know which was the node origin and the other choices in your link selection.
- You can change your link selection forward and backward rotating among all outbound links.
- Once you are Ok with your link selection, you can advance in traversing focusing to the node located at the other side of the link (the one is not the original node).
- Graphs can have non-connected clusters, so they wil be automatically nested in an upper syntetic graph linking all different clusters in order to allow traversing among them. **NOT YET**


## Mouse commands

- **click on background**: unselect any previous selection.
- **click on a node**: select a node, unselecting any previous selection.
- **click on a link**: select a link, unselecting any previous selection.

## Keyboard commands

- **`Right Arrow`**: select next element. It can behave differently according to the previous selection:
  - _A node was focused_: focus the first non visited link, highlighting the original focused node and all the other outbound links.
  - _A link was focused_: focus the node connected to the link which is not the original higlighted one, removing the highlight of the previously higlighted links and the original node, and highlighting the new outbound links.
- **`Left Arrow`**: rewinds one step on traversing hoistory, focusing the previous element in the traverse path and highlighting the needed elements as they were before.
- **`Down Arrow`**: focus next link looping if end is reached. In case no outbound link was previously focused, it will focus first outbound link.
- **`Up Arrow`**: focus previous link if beginning is reached. In case no outbound link was previously focused, it will focus last outbound link.
- **`Shift + Down Arrow`**: change to inner graph within a node. **NOT YET**
- **`Shift + Up Arrow`**: change to upper graph containing this graph. Aimed to deal with non-connected graphs. **NOT YET**