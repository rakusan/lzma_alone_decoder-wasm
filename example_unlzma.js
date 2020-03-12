#!/usr/bin/env node

if (process.argv.length < 4) {
    console.log("Usage: node example_unlzma.js input_file output_file");
    process.exit(1);
}

const fs = require("fs");
eval(fs.readFileSync("lzma_js.js").toString());

Module.onRuntimeInitialized = function() {
    const malloc             = Module.cwrap("js_malloc",             "number", [ "number" ]);
    const free               = Module.cwrap("js_free",                null,    [ "number" ]);

    const lzma_alone_decoder = Module.cwrap("js_lzma_alone_decoder", "number", [ "number" ]);
    const lzma_code          = Module.cwrap("js_lzma_code",          "number", [ "number", "number" ]);
    const lzma_end           = Module.cwrap("js_lzma_end",           null,     [ "number" ]);

    const set_next_in        = Module.cwrap("js_lzma_stream_set_next_in",   null,     [ "number", "number" ]);
    const set_avail_in       = Module.cwrap("js_lzma_stream_set_avail_in",  null,     [ "number", "number" ]);
    const set_next_out       = Module.cwrap("js_lzma_stream_set_next_out",  null,     [ "number", "number" ]);
    const set_avail_out      = Module.cwrap("js_lzma_stream_set_avail_out", null,     [ "number", "number" ]);
    const get_avail_in       = Module.cwrap("js_lzma_stream_get_avail_in",  "number", [ "number" ]);
    const get_avail_out      = Module.cwrap("js_lzma_stream_get_avail_out", "number", [ "number" ]);

    const LZMA_OK = 0;
    const LZMA_STREAM_END = 1;

    const LZMA_RUN = 0;
    const LZMA_FINISH = 3;


    const CHUNK_SIZE = 10240;
    const filebuf = Buffer.alloc(CHUNK_SIZE);
    const inbuf = malloc(CHUNK_SIZE);

    const OUTBUF_SIZE = 65536;
    const outbuf = malloc(OUTBUF_SIZE);

    const strm = lzma_alone_decoder(128 << 20);

    fs.open(process.argv[2], "r", (err, infd) => {
        if (err) throw err;

        fs.open(process.argv[3], "w", (err, outfd) => {
            if (err) throw err;

            function close() {
                fs.close(infd, err => {
                    if (err) throw err;
                });
                fs.close(outfd, err => {
                    if (err) throw err;
                });
                lzma_end(strm);
                free(inbuf);
                free(outbuf);
            }

            function readNextChunk() {
                fs.read(infd, filebuf, 0, CHUNK_SIZE, null, (err, nread) => {
                    if (err) {
                        close();
                        throw err;
                    }
                    if (nread === 0) {
                        close();
                        throw "Unexpected EOF";
                    }

                    Module.HEAPU8.set(new Uint8Array(filebuf.buffer), inbuf);
                    set_next_in(strm, inbuf);
                    set_avail_in(strm, nread);

                    let ret, avail_out;
                    do {
                        set_next_out(strm, outbuf);
                        set_avail_out(strm, OUTBUF_SIZE);

                        ret = lzma_code(strm, LZMA_RUN);

                        avail_out = get_avail_out(strm);
                        const outsize = OUTBUF_SIZE - avail_out;
                        fs.write(outfd, Module.HEAPU8, outbuf, outsize, (err) => {
                            if (err) {
                                close();
                                throw err;
                            }
                        });

                    } while (ret === LZMA_OK && avail_out === 0);

                    if (get_avail_in(strm) > 0) {
                        close();
                        throw "Unexpected bytes in input buffer";
                    }

                    switch (ret) {
                        case LZMA_OK:
                            readNextChunk();
                            break;
                        case LZMA_STREAM_END:
                            close();
                            break;
                        default:
                            close();
                            throw "lzma_code: error = " + ret;
                    }
                });
            }
            readNextChunk();
        });
    });
};
