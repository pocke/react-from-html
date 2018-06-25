import React from "react";
import { parseHtml } from "./parseHtml";
import { DynamicProps } from "./DynamicProps";
import { attributesToProps } from "./attributesToProps";

export interface ReactFromHtmlOptions {
  replace?(node: Node, props: object): React.ReactChild;
}

export class ReactFromHtml {
  readonly replace: (node: Node, props: DynamicProps) => React.ReactNode;

  constructor(options: ReactFromHtmlOptions = {}) {
    this.replace = options.replace || this.nodeToReactNode.bind(this);
  }

  elementToReactNode(
    element: Readonly<Element>,
    extraProps: Readonly<DynamicProps>
  ): React.ReactNode {
    const props: DynamicProps = {};
    const children = [];

    if (element.nodeName === "SCRIPT" || element.nodeName === "STYLE") {
      if (element.firstChild) {
        props.dangerouslySetInnerHTML = {
          __html: (element.firstChild as Text).data
        };
      }
    } else if (element.nodeName === "TEXTAREA") {
      if (element.firstChild) {
        props.defaultValue = (element.firstChild as Text).data;
      }
    } else {
      children.push(...this.nodesToReactNodes(element.childNodes));
    }

    return React.createElement(
      element.nodeName.toLowerCase(),
      { ...attributesToProps(element.attributes), ...props, ...extraProps },
      ...children
    );
  }

  nodeToReactNode(node: Node, props: DynamicProps): React.ReactNode {
    if (node.nodeName === "#text") {
      return (node as Text).data;
    } else {
      return this.elementToReactNode(node as Element, props);
    }
  }

  nodesToReactNodes(nodes: ArrayLike<Node>): Array<React.ReactNode> {
    const reactNodes: Array<React.ReactNode> = [];
    for (let i = 0, len = nodes.length; i < len; i++) {
      let reactNode = this.nodeToReactNode(nodes[i], { key: i });
      reactNodes.push(reactNode);
    }
    return reactNodes;
  }

  public parse(html: string): React.ReactElement<DynamicProps> {
    const nodeList = parseHtml(html);
    return <>{this.nodesToReactNodes(nodeList)}</>;
  }
}