#include <emscripten/emscripten.h>
#include <stdlib.h>
#include "lzma.h"

void* EMSCRIPTEN_KEEPALIVE create_buffer(size_t size) {
    return malloc(size);
}

void EMSCRIPTEN_KEEPALIVE destroy_buffer(void *ptr) {
    free(ptr);
}

lzma_ret EMSCRIPTEN_KEEPALIVE lzma_decode(
    uint8_t* inbuf,
    size_t insize,
    uint8_t* outbuf,
    size_t outsize)
{
    lzma_stream stream = LZMA_STREAM_INIT;
    lzma_ret ret = lzma_alone_decoder(&stream, 128 << 20);
    if (ret == LZMA_OK) {
        stream.next_in = inbuf;
        stream.avail_in = insize;
        stream.next_out = outbuf;
        stream.avail_out = outsize;
        ret = lzma_code(&stream, LZMA_FINISH);
    }
    lzma_end(&stream);
    return ret;
}
