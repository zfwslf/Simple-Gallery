import struct

def get_image_info(data):
    if is_png(data):
        w, h = struct.unpack('>LL', data[16:24])
        width = int(w)
        height = int(h)
    else:
        raise Exception('not a png image')
    return width, height

def is_png(data):
    return (data[:8] == '\211PNG\r\n\032\n'and (data[12:16] == 'IHDR'))

if __name__ == '__main__':
    with open('foo.png', 'rb') as f:
        data = f.read()

    print is_png(data)
    print get_image_info(data)