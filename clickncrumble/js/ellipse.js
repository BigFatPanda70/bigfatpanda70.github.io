
// https://stackoverflow.com/questions/8447665/c-bresenhams-line-algorithm-draw-arc-and-rotate

/* One of Abrash's ellipse algorithms  */

void draw_ellipse(int x, int y, int a, int b, int color)
{
    int wx, wy;
    int thresh;
    int asq = a * a;
    int bsq = b * b;
    int xa, ya;

    draw_pixel(x, y+b, color);
    draw_pixel(x, y-b, color);

    wx = 0;
    wy = b;
    xa = 0;
    ya = asq * 2 * b;
    thresh = asq / 4 - asq * b;

    for (;;) {
        thresh += xa + bsq;

        if (thresh >= 0) {
            ya -= asq * 2;
            thresh -= ya;
            wy--;
        }

        xa += bsq * 2;
        wx++;

        if (xa >= ya)
          break;


        draw_pixel(x+wx, y-wy, color);
        draw_pixel(x-wx, y-wy, color);
        draw_pixel(x+wx, y+wy, color);
        draw_pixel(x-wx, y+wy, color);
    }

    draw_pixel(x+a, y, color);
    draw_pixel(x-a, y, color);

    wx = a;
    wy = 0;
    xa = bsq * 2 * a;

    ya = 0;
    thresh = bsq / 4 - bsq * a;

    for (;;) {
        thresh += ya + asq;

        if (thresh >= 0) {
            xa -= bsq * 2;
            thresh = thresh - xa;
            wx--;
        }

        ya += asq * 2;
        wy++;

        if (ya > xa)
          break;

        draw_pixel(x+wx, y-wy, color);
        draw_pixel(x-wx, y-wy, color);
        draw_pixel(x+wx, y+wy, color);
        draw_pixel(x-wx, y+wy, color);
    }
}
