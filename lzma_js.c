#include <emscripten/emscripten.h>
#include <stdlib.h>
#include "lzma.h"

void* EMSCRIPTEN_KEEPALIVE js_malloc(size_t size) {
    return malloc(size);
}

void EMSCRIPTEN_KEEPALIVE js_free(void *ptr) {
    free(ptr);
}

lzma_stream* EMSCRIPTEN_KEEPALIVE js_lzma_alone_decoder(uint64_t memlimit) {
    lzma_stream* strm = malloc(sizeof(lzma_stream));
    if (!strm) {
        return NULL;
    }

    lzma_stream tmp = LZMA_STREAM_INIT;
    *strm = tmp;

    lzma_ret ret = lzma_alone_decoder(strm, memlimit);
    if (ret == LZMA_OK) {
        return strm;
    }

    lzma_end(strm);
    return NULL;
}

lzma_ret EMSCRIPTEN_KEEPALIVE js_lzma_code(lzma_stream *strm, lzma_action action) {
    return lzma_code(strm, action);
}

void EMSCRIPTEN_KEEPALIVE js_lzma_end(lzma_stream *strm) {
    lzma_end(strm);
    free(strm);
}

#define JS_LZMA_STREAM_SET(type, member) \
    void EMSCRIPTEN_KEEPALIVE js_lzma_stream_set_##member(lzma_stream* strm, type member) { strm->member = member; }

#define JS_LZMA_STREAM_GET(type, member) \
    type EMSCRIPTEN_KEEPALIVE js_lzma_stream_get_##member(lzma_stream* strm) { return strm->member; }

JS_LZMA_STREAM_SET(const uint8_t*, next_in)
JS_LZMA_STREAM_SET(size_t, avail_in)
JS_LZMA_STREAM_SET(uint8_t*, next_out)
JS_LZMA_STREAM_SET(size_t, avail_out)

JS_LZMA_STREAM_GET(size_t, avail_in)
JS_LZMA_STREAM_GET(size_t, avail_out)
