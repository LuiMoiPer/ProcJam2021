export default class ArrayUtil extends Array {
    /**
     * Remove one element from the array
     * 
     *     Array.splice(index, 1); To speed up
     *     High-speed processing can be expected especially when deleting the end of an array or the beginning of an array.
     * @param {Array} array 配列
     * @param {number} index 添え字
     */
    static delete(array, index) {
        if (index == array.length-1) array.pop(); // It will be faster if you delete the end of the array with Array.pop().
        else if (index == 0) array.shift(); // Deleting the beginning of the array with Array.shift() speeds up (some environments don't change much)
        else array.splice(index, 1); // To delete other than the beginning and end of the array, delete it with Array.splice().
    }
}