/**
 * A class that provides a fixed pattern of random numbers
 */
export default class RandomUtil {
    /**
     * Reset the seed value of a random number
     */
    static resetSeed() {
        this.init = true;
        this.x = 123456789;
        this.y = 362436069;
        this.z = 521288629;
        this.w = 8867512;
    }

    /**
     * Returns a random number
     * 
     *     Math.random() Unlike, a random number is returned in a fixed pattern every time
     * Xorshift algorithm
     * @returns {number} random number
     */
    static random() {
        if (!this.init) this.resetSeed();
        const t = this.x ^ (this.x << 11);
        this.x = this.y; this.y = this.z; this.z = this.w;
        let r = this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
        r = Math.abs(r) / 2147483648 % 2;
        return r;
    }
}