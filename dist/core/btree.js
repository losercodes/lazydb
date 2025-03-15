"use strict";
class BTreeNode {
    constructor(leaf = false) {
        this.leaf = leaf;
        this.keys = [];
        this.children = [];
        this.order = 5; // B-tree order (max 5 keys per node)
    }
}
class BTree {
    constructor() {
        this.root = new BTreeNode(true);
    }
    insert(key, value) {
        let root = this.root;
        if (root.keys.length === (2 * this.root.order) - 1) {
            const newRoot = new BTreeNode(false);
            newRoot.children.push(root);
            this.splitChild(newRoot, 0);
            this.root = newRoot;
        }
        this.insertNonFull(this.root, key, value);
    }
    insertNonFull(node, key, value) {
        let i = node.keys.length - 1;
        if (node.leaf) {
            node.keys.push({ key, value });
            node.keys.sort((a, b) => a.key - b.key);
        }
        else {
            while (i >= 0 && key < node.keys[i].key)
                i--;
            i++;
            if (node.children[i].keys.length === (2 * this.root.order) - 1) {
                this.splitChild(node, i);
                if (key > node.keys[i].key)
                    i++;
            }
            this.insertNonFull(node.children[i], key, value);
        }
    }
    splitChild(parent, index) {
        const order = this.root.order;
        const child = parent.children[index];
        const newNode = new BTreeNode(child.leaf);
        const mid = Math.floor(order - 1);
        parent.keys.splice(index, 0, child.keys[mid]);
        newNode.keys = child.keys.splice(mid + 1);
        if (!child.leaf)
            newNode.children = child.children.splice(mid + 1);
        parent.children.splice(index + 1, 0, newNode);
    }
    search(key) {
        return this.searchNode(this.root, key);
    }
    searchNode(node, key) {
        let i = 0;
        while (i < node.keys.length && key > node.keys[i].key)
            i++;
        if (i < node.keys.length && key === node.keys[i].key)
            return node.keys[i].value;
        if (node.leaf)
            return null;
        return this.searchNode(node.children[i], key);
    }
}
module.exports = BTree;
