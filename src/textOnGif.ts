// Untyped library
// @ts-ignore
import * as gifFrames from "gif-frames";

// Untyped Library
// @ts-ignore
import * as GIFEncoder from "gif-encoder-2";

import * as Events from "events";
import { Image, ImageData, createCanvas, CanvasRenderingContext2D, registerFont } from "canvas";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";

import type { CanvasOptions, ExtractedFrame, FontOptions, Row, TextOptions } from "../src/types";
import { Readable, type Stream } from "stream";

/**
 * Event typings for `TextOnGif`
 */
declare interface TextOnGif<T extends string | Buffer> {
    on(event: "frameDataExtreacted", listener: () => void): this;
    on(event: "extractionComplete", listener: () => void): this;
    on(event: "progress", listener: (percent: number) => void): this;
    on(event: "frameIndexUpdate", listener: (index:number) => void): this;
    on(event: "finished", listener: () => void): this;
}

/**
 * TextOnGif Class
 * @extends {Events}
 */
class TextOnGif<T extends string | Buffer> extends Events implements TextOnGif<T> {
    /**
     * The source of the GIF. Either a file path, URL, or local Buffer.
     */
    public source: T;

    /**
     * The number of frames of the source gif.
     * @default 0
     */
    private numberOfFrames: number = 0;

    /**
     * Whether text has been retained.
     * @default false
     */
    private retained: boolean = false;

    /**
     * All of the extracted frames of the source gif if already extracted.
     */
    private extractedFrames: ExtractedFrame[] = [];

    /**
     * The width of the canvas element.
     * @default 0
     */
    public width: number = 0;

    /**
     * The height of the canvas element.
     * @default 0
     */
    public height: number = 0;

    /**
     * The text currently being added to the gif.
     * @default "Hello World!"
     */
    public text: string = "Hello World!";

    /**
     * This instance's text options
     * @type {TextOptions}
     */
    public textOptions: TextOptions = {
        fontFamily: "calibri",
        fontColor: "white",
        strokeColor: "transparent",
        fontSize: "32px",
        strokeWidth: 1,
        alignmentX: "center",
        alignmentY: "bottom",
        offsetX: 10,
        offsetY: 10,
        positionX: null,
        positionY: null,
        rowGap: 5,
        repeat: 0,
        retain: false,
        transparent: false
    };

    /**
     * The buffer of the result gif.
     * @type {Buffer}
     */
    private buffer: Buffer | null = null;

    /**
     * The canvas options
     * @type {CanvasOptions}
     */
    public canvasOptions: CanvasOptions = {
        x: 0,
        y: 0,
        textAlign: "start",
        textBaseline: "bottom"
    };

    /**
     * The rows of text.
     */
    private rows: Row[] = [];

    /**
     * Creates a new `  TextOnGif` instance
     * @param {string} path The path of the source gif.
     */
    constructor(gifSource: T) {
        super();

        this.source = gifSource;
        this.extractedFrames = [];
    }

    /**
     * Write a Stream to the `outputPath`.
     * @param {Stream} data the data Stream.
     * @param {string} outputPath The path of the result file.
     */
    async writeStreamToFile(data: Stream, outputPath: string) {
        return await new Promise((res, rej) =>
            data
                .pipe(createWriteStream(outputPath))
                .on("error", rej)
                .on("finish", res)
        );
    }

    /**
     * Extracts every frame from the source gif and the array to `TextOnGif.extractedFrames`.
     * @private
     */
    async #extractFrames(): Promise<void> {
        const frameData = await gifFrames({
            url: this.source,
            frames: "all",
            outputType: "png",
            cumulative: false
        });

        this.width = frameData[0].frameInfo.width;
        this.height = frameData[0].frameInfo.height;
        this.numberOfFrames = frameData.length;
        this.emit("frameDataExtreacted");

        let i = 0;
        for await (const frame of frameData) {
            const imgPath = `frame-${i}.png`;

            try {
                await this.writeStreamToFile(frame.getImage(), imgPath);

                const img = new Image();
                img.src = imgPath;

                this.extractedFrames.push({
                    imageData: img,
                    delay: frame.frameInfo.delay * 10,
                    disposal: frame.frameInfo.disposal
                });

                unlink(imgPath).catch(() => null);
            } catch (err) {
                console.error(err);
            }

            ++i;
        }

        this.emit("extractionComplete");
    }

    /**
     * Adds text to the source gif.
     * @param {string} text The text to add.
     * @param {TextOptions} options The configuration for the text.
     */
    async setText(text: string, options?: TextOptions) {
        if (options)
            this.textOptions = Object.assign(this.textOptions, options);

        this.text = text;
        this.rows = [];
        await this.#extractFrames();

        return this;
    }

    /**
     * Writes the result gif buffer to a file.
     * @param {string} filePath The result file path.
     */
    async toFile(filePath: string) {
        await this.#renderGIF(this.text);

        if (this.buffer) {
            await this.writeStreamToFile(Readable.from(this.buffer), filePath);
            return true;
        } else {
            throw new Error("Result GIF buffer returned empty");
        }
    }
    
    /**
     * Verifies the rows of the text.
     * @param {CanvasRenderingContext2D} ctx The canvas context.
     */
    async createTextRows(ctx: CanvasRenderingContext2D) {
        let previewText: string[] = [], lineText = [];

        for (var word of this.text.split(" ")) {
            previewText.push(word);
            
            if (ctx.measureText(previewText.join(" ")).width > this.width) {
                this.rows.push({ text: lineText.join(" ") });
                
                previewText = [word];
                lineText = [];
            }
            
            lineText.push(word);
        }
        
        this.rows.push({
            text: lineText.join(" ")
        });
    }

    /**
     * Returns the result gif's buffer.
     */
    async toBuffer(): Promise<Buffer> {
        await this.#renderGIF(this.text);

        return this.buffer!;
    }

    /**
     * Applies the text onto the gif and assigns the result buffer to `TextOnGif.buffer`.
     * @param {string} text The text to apply.
     */
    async #renderGIF(text: string) {
        let encoder = new GIFEncoder(
            this.width,
            this.height,
            "neuquant",
            false,
            this.extractedFrames.length
        );
        if (this.textOptions.transparent) {
            encoder.setTransparent(true);
        }
        encoder.setRepeat(this.textOptions.repeat);

        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext("2d");

        ctx.font =
            this.textOptions.fontSize + " " + this.textOptions.fontFamily;

        encoder.start();

        encoder.on("progress", (percent: number) => {
            this.emit("progress", percent);
        });

        const approximateLineHeight = ctx.measureText("M").width;
        await this.createTextRows(ctx)

        if (this.textOptions.positionX != null) {
            this.canvasOptions.textAlign = "start" as CanvasTextAlign;
            this.canvasOptions.x = this.textOptions.positionX;
        }
        else {
            if (this.textOptions.alignmentX == "right") {
                this.canvasOptions.textAlign = "right";
                this.canvasOptions.x = this.width - this.textOptions.offsetX;
            }
            else if (this.textOptions.alignmentX == "left") {
                this.canvasOptions.textAlign = "left";
                this.canvasOptions.x = this.textOptions.offsetX;
            }
            else if (this.textOptions.alignmentX == "center") {
                this.canvasOptions.textAlign = "center";
                this.canvasOptions.x = this.width / 2;
            }
        }
        if (this.textOptions.positionY != null) {
            this.canvasOptions.textBaseline = "top";
            this.canvasOptions.y = this.textOptions.positionY;
        }
        else {
            if (this.rows.length == 1) {
                if (this.textOptions.alignmentY == "top") {
                    this.canvasOptions.textBaseline = "hanging";
                    this.canvasOptions.y = this.textOptions.offsetY;
                }
                else if (this.textOptions.alignmentY == "middle") {
                    this.canvasOptions.textBaseline = "middle";
                    this.canvasOptions.y = this.height / 2;
                }
                else {
                    this.canvasOptions.textBaseline = "bottom";
                    this.canvasOptions.y = this.height - this.textOptions.offsetY;
                }
            }
            else {
                if (this.textOptions.alignmentY == "top") {
                    this.canvasOptions.textBaseline = "hanging";
                    this.canvasOptions.y = this.textOptions.offsetY;
                }
                else if (this.textOptions.alignmentY == "middle") {
                    this.canvasOptions.textBaseline = "top";
                    this.canvasOptions.y =
                        (this.height -
                            (this.rows.length * approximateLineHeight +
                                (this.rows.length - 1) * this.textOptions.rowGap)) /
                            2;
                }
                else {
                    this.canvasOptions.textBaseline = "bottom";
                    this.canvasOptions.y =
                        this.height -
                            ((this.rows.length - 1) *
                                (approximateLineHeight + this.textOptions.rowGap) +
                                this.textOptions.offsetY);
                }
            }
        }

        for (let index = 0; index < this.extractedFrames.length; index++) {
            this.emit("frameIndexUpdate", index);

            try {
                if (!this.retained)
                    ctx.drawImage(this.extractedFrames[index].imageData, 0, 0);
                else
                    ctx.putImageData(
                        this.extractedFrames[index].imageData,
                        0,
                        0
                    );
            } catch (err) {}

            ctx.strokeStyle = this.textOptions.strokeColor;
            ctx.lineWidth = this.textOptions.strokeWidth;
            ctx.font = this.textOptions.fontSize + " " + this.textOptions.fontFamily;
            ctx.fillStyle = this.textOptions.fontColor;
            ctx.textAlign = this.canvasOptions.textAlign as CanvasTextAlign;
            ctx.textBaseline = this.canvasOptions.textBaseline as CanvasTextBaseline;

            let withoutText: ImageData;

            if (this.rows.length == 0) await this.createTextRows(ctx);

            if (this.extractedFrames[index].disposal != 2) {
                withoutText = ctx.getImageData(0, 0, this.width, this.height);
            }

            if (this.rows.length == 1) {
                ctx.strokeText(this.text, this.canvasOptions.x, this.canvasOptions.y);
                ctx.fillText(this.text, this.canvasOptions.x, this.canvasOptions.y);
            } else {
                var reverseRows = new Array(...this.rows).reverse();
                for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
                    var lineText = reverseRows[rowIndex].text
                    await ctx.strokeText(lineText, this.canvasOptions.x, this.canvasOptions.y - 
                        (rowIndex * (approximateLineHeight + this.textOptions.rowGap)));
                    await ctx.fillText(lineText, this.canvasOptions.x, this.canvasOptions.y - 
                        (rowIndex * (approximateLineHeight + this.textOptions.rowGap)));
                }
            }

            encoder.setDelay(this.extractedFrames[index].delay);
            encoder.setDispose(this.extractedFrames[index].disposal);
            encoder.addFrame(ctx);

            if (this.textOptions.retain)
                this.extractedFrames[index].imageData = ctx.getImageData(
                    0,
                    0,
                    this.width,
                    this.height
                );

            if (this.extractedFrames[index].disposal == 2) {
                ctx.clearRect(0, 0, this.width, this.height);
            } else {
                ctx.putImageData(withoutText!, 0, 0);
            }
        }

        encoder.finish();

        this.buffer = await encoder.out.getData();
        this.emit("finished");
    }

    /**
     * Registers a font family.
     * @param {FontOptions} options The configuration of the font.
     */
    registerFont(options: FontOptions) {
        registerFont(options.path, { family: options.family });
    }

    /**
     * Returns the width of the canvas.
     * @returns {Promise<number>}
     */
    async getWidth(): Promise<number> {
        if (this.width) return Promise.resolve(this.width);

        return new Promise((resolve) => {
            this.on("frameDataExtreacted", () => {
                resolve(this.width);
            });
        }) as Promise<number>;
    }

    /**
     * Returns the height of the canvas.
     * @returns {Promise<number>}
     */
    async getHeight(): Promise<number> {
        if (this.height) return this.height;

        return new Promise((resolve) => {
            this.on("frameDataExtreacted", () => {
                resolve(this.height);
            });
        }) as Promise<number>;
    }

    /**
     * Returns the number of frames of the gif.
     * @returns {Promise<number>}
     */
    async noOfFrames(): Promise<number> {
        if (this.numberOfFrames) {
            return Promise.resolve(this.numberOfFrames);
        } else {
            return new Promise((resolve) => {
                this.on("frameDataExtreacted", () => {
                    resolve(this.numberOfFrames);
                });
            });
        }
    }
}

export default TextOnGif;