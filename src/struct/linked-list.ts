/**
 * ## Node
 * - value: T
 * - next: Node<T> | null
 */
export class Node<T> {
    value: T;
    next: Node<T> | null = null;

    constructor (value: T) {
        this.value = value;
    }
}

/**
 * ## LinkedList
 * - head: Node<T> | null
 * - tail: Node<T> | null
 * - size: number
 */
export class LinkedList<T> {
    head: Node<T> | null = null;
    tail: Node<T> | null = null;
    size: number = 0;

    //
    static fromArray<T>(arr: T[]) {
        const linkedList = new LinkedList<T>();
        arr.forEach(value => linkedList.append(value));
        return linkedList;
    }

    toArray() {
        let currentNode = this.head;
        const values: T[] = [];
        while (currentNode) {
            values.push(currentNode.value);
            currentNode = currentNode.next;
        }
        return values;
    }
    /**
     * ### append a value to the linked list
     * @param value 
     */
    append(value: T): void {
        const newNode = new Node(value);
        if (this.tail) {
            this.tail.next = newNode;
        }
        this.tail = newNode;
        if (!this.head) {
            this.head = newNode;
        }
        this.size++;
    }

    /**
     * ### prepend a value to the linked list
     * @param value 
     */
    prepend(value: T): void {
        const newNode = new Node(value);
        if (this.head) {
            newNode.next = this.head;
        }
        this.head = newNode;
        if (!this.tail) {
            this.tail = newNode;
        }
        this.size++;
    }

    /**
     * ### delete a value from the linked list
     * @param value 
     * @returns 
     */
    delete(value: T): void {
        if (!this.head) return;

        // 删除头部节点
        while (this.head && this.head.value === value) {
            this.head = this.head.next;
            this.size--;
        }

        let currentNode = this.head;
        while (currentNode && currentNode.next) {
            if (currentNode.next.value === value) {
                currentNode.next = currentNode.next.next;
                this.size--;
            } else {
                currentNode = currentNode.next;
            }
        }

        if (this.tail?.value === value) {
            this.tail = currentNode;
        }
    }

    /**
     * ### find a value from the linked list
     * @param value 
     * @returns 
     */
    find(value: T): Node<T> | null {
        let currentNode = this.head;
        while (currentNode) {
            if (currentNode.value === value) {
                return currentNode;
            }
            currentNode = currentNode.next;
        }
        return null;
    }

    /**
     * ### convert the linked list to string
     * @returns 
     */
    toString(): string {
        let currentNode = this.head;
        const values: T[] = [];
        while (currentNode) {
            values.push(currentNode.value);
            currentNode = currentNode.next;
        }
        return values.join(" -> ");
    }

    /**
     * ### get the size of the linked list
     * @returns 
     */
    getSize(): number {
        return this.size;
    }

    /**
     * ### clear the linked list
     */
    clear(): void {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }
}

if (import.meta.vitest) {
    // 使用示例
    const linkedList = new LinkedList<number>();
    linkedList.append(10);
    linkedList.append(20);
    linkedList.append(30);
    linkedList.prepend(5);

    const { it, expect } = import.meta.vitest;
    it('linked list', () => {
        expect(linkedList.toString()).toBe('5 -> 10 -> 20 -> 30');
        expect(linkedList.getSize()).toBe(4);
    })

    it('linked list delete', () => {
        linkedList.delete(20);
        expect(linkedList.toString()).toBe('5 -> 10 -> 30');
        expect(linkedList.getSize()).toBe(3);
    })

    it('linked list find', () => {
        const node = linkedList.find(10);
        expect(node?.value).toBe(10);
    })

    it('linked list clear', () => {
        linkedList.clear();
        expect(linkedList.toString()).toBe('');
        expect(linkedList.getSize()).toBe(0);
    })
}
