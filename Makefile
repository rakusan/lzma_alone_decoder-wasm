XZ_VERSION := 5.2.4
XZ_DIR := xz-$(XZ_VERSION)
XZ_SOURCE_FILE := xz-$(XZ_VERSION).tar.gz
XZ_SOURCE_URL := https://sourceforge.net/projects/lzmautils/files/$(XZ_SOURCE_FILE)/download

MZ_VERSION := 2.1.0
MZ_DIR := miniz-$(MZ_VERSION)
MZ_SOURCE_FILE := miniz-$(MZ_VERSION).tar.gz
MZ_SOURCE_URL := https://github.com/richgel999/miniz/archive/$(MZ_VERSION).tar.gz

MEMORY_GROWTH := -s ALLOW_MEMORY_GROWTH=1
#MAXIMUM_MEMORY := -s MAXIMUM_MEMORY=128MB
#INITIAL_MEMORY := -s INITIAL_MEMORY=64MB
#ASSERTIONS := -s ASSERTIONS=1


all: lzma_js.js lzma_js.wasm

lzma_js.js lzma_js.wasm: lzma_js.c $(XZ_DIR)/src/liblzma/.libs/liblzma.a $(MZ_DIR)/libminiz.a
	emcc -o lzma_js.js lzma_js.c -O3 \
	  -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap']" -s NO_EXIT_RUNTIME=1 \
	  $(MEMORY_GROWTH) $(MAXIMUM_MEMORY) $(INITIAL_MEMORY) $(ASSERTIONS) \
	  -I"$(XZ_DIR)/src/liblzma/api" -L"$(XZ_DIR)/src/liblzma/.libs" -llzma \
	  -I"$(MZ_DIR)" -L"$(MZ_DIR)" -lminiz


$(XZ_DIR)/src/liblzma/.libs/liblzma.a: $(XZ_DIR)
	cd $(XZ_DIR); \
	  emconfigure ./configure --enable-threads=no && emmake make

$(XZ_DIR): $(XZ_SOURCE_FILE)
	tar xzf $(XZ_SOURCE_FILE)

$(XZ_SOURCE_FILE):
	curl -L -o $(XZ_SOURCE_FILE) $(XZ_SOURCE_URL)


$(MZ_DIR)/libminiz.a: $(MZ_DIR)
	cd $(MZ_DIR); \
	  emcmake cmake && emmake make

$(MZ_DIR): $(MZ_SOURCE_FILE)
	tar xzf $(MZ_SOURCE_FILE)

$(MZ_SOURCE_FILE):
	curl -L -o $(MZ_SOURCE_FILE) $(MZ_SOURCE_URL)


.PHONY: clean cleanall
clean:
	rm -f lzma_js.js lzma_js.wasm

cleanall: clean
	rm -rf $(XZ_DIR) $(MZ_DIR)
	rm -i $(XZ_SOURCE_FILE) $(MZ_SOURCE_FILE)
