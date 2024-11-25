# Polly🦜Graph📈

This is a javascript code to enable an accesible way to keyboard traverse a non-directed graph, this is, a bidimendional diagram made up of nodes and connecting edges among pairs of nodes.

It aims to be useful to everybody, but it has been designed to have in mind vision impairmed people using VoiceOver or similar text to voice HTML readers using `aria` tags as exposed in https://www.w3.org/TR/html-aria/


## Traversing general concepts

It relies on HTML focus on one single graph element, being those elements **nodes** and **edges**.

- You start with one selected element and can change focus to another one using keyboard arrows or mouse-clicking on another element.
- The path with the history of your past selections is stored to go back in time in order to change your traversing and continue through new paths.
- Once you set the focus on a node, you can change focus to any edge pointing out from it.
- Being in a node, once you set the focus on an outbound edge, the original node and the rest of outbound edges are shown in a different visual way, letting you know which was the node origin and the other choices in your edge selection.
- You can change your edge selection forward and backward rotating among all outbound edges.
- Once you are Ok with your edge selection, you can advance in traversing focusing to the node located at the other side of the edge (the one which is not the original node).
- Graphs can have non-connected clusters, so they wil be automatically nested in an upper syntetic graph edgeing all different clusters in order to allow traversing among them.
- Every node or edge can contain detailed information within, which will be exposed on every selection in the dedicated Info Area.


## Current commands

- **Focus Forward (`Right Arrow`)**: select next element and storing it in the traverse history. It can behave differently according to the previous selection:
  - _A node was focused_: focus on the first non visited edge, highlighting the original focused node and all the other outbound edges.
  - _An edge was focused_: focus on the node connected to the edge which is not the original higlighted one, removing the highlight of the previously higlighted edges and the original node, and highlighting the new outbound edges.
- **Focus Backwards (`Left Arrow`)**: rewinds one step on traversing history, focusing on the previous element in the traverse path and highlighting the needed elements as they were before.
- **Focus any Element (`Mouse/Trackpad Click Left`)**: selects a node or edge, unselecting any previous selection. New selection will be stored in the traverse history, so focusing backwards will undo this new selection.
- **Focus Next Edge (`Down Arrow`)**: focus on next edge according to their creation order, looping if end is reached. In case no outbound edge was previously focused, it will focus first outbound edge. In case no outbound edge was previously focused, it will focus last outbound edge. In case there's no edge, selection won't change from unique node. It's important to notice edges won't be represented secuentially, given node and related edges positions are somehow random generated.
- **Focus Previous Edge (`Up Arrow`)**: focus previous edge, looping if beginning is reached in a symmetrical way to Focus Next Edge.
- **Focus on Info Area (`Space Bar`)**: the Info Area will get control to be be read by the Voice Over.
- **Focus Back to the graph (`Escape`)**: the last selected element will be selected again, leaving the Info Area to keep on traversing the graph.
- **Change to Inner Graph (`Enter` or `Double Click Left`)**: change current representation to inner graph within a node. In case graph have non-conected clusters it will allow to deal with non-connected graphs. **NOT YET**: Traverse history will reflect this dig-in and can be reversed going backwards.
- **Change to Outer Graph (`Shift + Enter` or `Shift + Double Click Left`)**: change to upper graph containing this graph. In case graph have non-conected clusters it will allow to deal with non-connected graphs. **NOT YET**: Traverse history will reflect this dig-out and can be reversed going backwards.


## Installation

NPM pending to upload.


## Usage on JavaScript code

Pending.