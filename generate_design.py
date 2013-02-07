"""Hardcode the trial info as a Javascript file."""
from __future__ import division
import time
import json
import itertools
from copy import deepcopy
from string import letters
import numpy as np
from scipy.spatial.distance import euclidean

n_pairs = 15
n_circles = 9
color_base = ["OrangeRed", "LimeGreen", "RoyalBlue"]
inert_color = color_base[1]
colors = np.repeat(color_base, n_circles / len(color_base))
rs = np.random.RandomState(254)
width = 600
height = 400
xpos = np.linspace(0, width, 8)[1:-1].astype(int)
ypos = np.linspace(0, height, 6)[1:-1].astype(int)
grid = np.array(list(itertools.product(xpos, ypos)))


def main():
    """High-level abstraction of steps to generate the full design."""
    trials = []
    while len(trials) < n_pairs:
        candidate = make_array()
        if validate_array(candidate):
            candidate["id"] = letters[len(trials)]
            trials.append(candidate)
    for i in range(n_pairs):
        partner = make_array_partner(trials[i])
        trials.append(partner)
    write_javascript(trials)


def make_array():
    """Return a dict with all information to draw one stimulus array."""
    means = [rs.uniform(15, 95) for c in color_base]
    stds = [m / 8 for m in means]
    params = zip(means, stds)
    sizes = []
    for i, color in enumerate(colors):
        m_i, s_i = params[color_base.index(color)]
        sizes.append(int(rs.normal(m_i, s_i)))
    locs = rs.permutation(grid)[:n_circles]
    locs += rs.randint(-10, 10, (n_circles, 2))
    xlocs, ylocs = locs.T
    good_target = False
    while not good_target:
        targ_index = rs.randint(n_circles)
        if colors[targ_index] != inert_color:
            good_target = True
    targ_xloc = xlocs[targ_index]
    targ_yloc = ylocs[targ_index]
    targ_size = sizes[targ_index]
    targ_color = colors[targ_index]

    data = dict(colors=colors.tolist(),
                sizes=sizes,
                xlocs=xlocs.tolist(),
                ylocs=ylocs.tolist(),
                targ_index=targ_index,
                targ_color=str(targ_color),
                targ_size=targ_size,
                targ_xloc=int(targ_xloc),
                targ_yloc=int(targ_yloc),
                group_means=means,
                group_stds=stds,
                )
    return data


def validate_array(arr):
    """Return True if candidate is an array that passes our constraints."""

    # No overlapping circles
    for src, dst in itertools.combinations(range(n_circles), 2):
        src_pos = [arr["xlocs"][src], arr["ylocs"][src]]
        dst_pos = [arr["xlocs"][dst], arr["ylocs"][dst]]
        total_size = arr["sizes"][src] / 2 + arr["sizes"][dst] / 2
        separation = euclidean(src_pos, dst_pos)
        if total_size > separation + 5:
            return False

    return True


def get_partner_color(orig_color):
    """Return the complement color to the input."""
    choices = deepcopy(color_base)
    choices.pop(choices.index(inert_color))
    old_index = choices.index(orig_color)
    new_index = (old_index + 1) % 2
    return choices[new_index]


def make_array_partner(solo):
    """Returns a validated array dictionary paired with the input."""
    good_partner = False
    while not good_partner:
        partner = deepcopy(solo)

        new_targ_color = get_partner_color(solo["targ_color"])

        swap_color = solo["targ_color"]
        poss_swap_indices = np.argwhere(colors == new_targ_color)
        swap_index = rs.permutation(poss_swap_indices)[0]

        partner["targ_color"] = new_targ_color
        partner["colors"][partner["targ_index"]] = new_targ_color
        partner["colors"][swap_index] = swap_color
        if validate_array(partner):
            good_partner = True

    return partner


def write_javascript(trials):
    """Given a list of trial dicts, write a valid javascript file."""
    with open("design.js", "w") as fid:
        fid.write("//Automatically generated by %s script on %s\n" % (
                  __file__, time.asctime()))
        fid.write("design = [\n")
        for i, trial in enumerate(trials):
            fid.write(json.dumps(trial, indent=True, sort_keys=True))
            if i < len(trials) - 1:
                fid.write(",\n")
            else:
                fid.write("\n")
        fid.write("]")


if __name__ == "__main__":
    main()
