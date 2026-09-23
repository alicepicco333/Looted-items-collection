"""Render an RDF/XML file as a graph image (PNG), like the images in rdf_files_graphs/.

    python tools/rdf_graph.py "rdf_files_graphs/6_Poland_Gdańsk Astronomical Clock.rdf"

Writes the PNG next to the RDF file (same name). Parsing with rdflib also checks that
the file is valid RDF/XML. Nodes use rdfs:label when there is one; literals are shown
as boxes, resources as rounded nodes (with their CIDOC class), edges carry the property's
local name. Nodes are placed in rings around the main object, by distance.
"""
import sys, os, textwrap
import rdflib
from rdflib import URIRef, Literal
from rdflib.namespace import RDFS, RDF
import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def local(uri):
    s = str(uri)
    for sep in ("#", "/"):
        if sep in s:
            s = s.rsplit(sep, 1)[1] or s
    return s


def render(path):
    g = rdflib.Graph()
    g.parse(path, format="xml")
    labels = {s: str(o) for s, o in g.subject_objects(RDFS.label)}
    classes = {}
    for s_, o in g.subject_objects(RDF.type):
        classes.setdefault(s_, []).append(local(o))

    G = nx.DiGraph()
    node_label, is_literal = {}, {}
    def name(n):
        base = labels.get(n, local(n))
        return f"{base} · {'/'.join(classes[n])}" if n in classes else base
    for i, (s_, p, o) in enumerate(sorted(g)):
        if p in (RDFS.label, RDF.type):
            continue
        s_id = str(s_)
        node_label[s_id], is_literal[s_id] = name(s_), False
        if isinstance(o, Literal):
            o_id = f"lit{i}"
            node_label[o_id], is_literal[o_id] = textwrap.shorten(str(o), 80, placeholder="…"), True
        else:
            o_id = str(o)
            node_label[o_id], is_literal[o_id] = name(o), False
        G.add_edge(s_id, o_id, label=local(p))

    # rings around the main object (the node with most outgoing edges)
    root = max(G.nodes, key=lambda n: G.out_degree(n))
    dist = nx.single_source_shortest_path_length(G.to_undirected(), root)
    shells = {}
    for n, d in dist.items():
        shells.setdefault(d, []).append(n)
    ordered = [shells[d] for d in sorted(shells)]
    pos = nx.shell_layout(G, nlist=ordered, scale=1.0)
    # spread each ring a little further out than the default
    for d, nodes in enumerate(ordered):
        for n in nodes:
            pos[n] = pos[n] * (1 + 0.25 * d)

    fig = plt.figure(figsize=(24, 18), dpi=100)
    ax = fig.add_axes([0.01, 0.01, 0.98, 0.98])
    ax.set_axis_off()
    nx.draw_networkx_edges(G, pos, ax=ax, edge_color="#9A9AAE", arrows=True, arrowsize=9, width=0.8, node_size=2200)
    nx.draw_networkx_edge_labels(G, pos, ax=ax, edge_labels=nx.get_edge_attributes(G, "label"), font_size=7, font_color="#4A4A74",
                                 rotate=False, label_pos=0.45, bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none", alpha=0.9))
    for n, (x, y) in pos.items():
        text = "\n".join(textwrap.wrap(node_label[n], 24)) or " "
        if is_literal[n]:
            box = dict(boxstyle="square,pad=0.35", fc="#FFF6E8", ec="#C9A86A", lw=0.8)
        elif n == root:
            box = dict(boxstyle="round,pad=0.6", fc="#4A4A74", ec="#4A4A74", lw=1)
        else:
            box = dict(boxstyle="round,pad=0.4", fc="#ECEBFA", ec="#4A4A74", lw=1)
        ax.text(x, y, text, ha="center", va="center", fontsize=8 if n != root else 11, color="white" if n == root else "#1E1E33", bbox=box, zorder=3)
    out = os.path.splitext(path)[0] + ".png"
    fig.savefig(out, facecolor="white")
    plt.close(fig)
    print(f"{out}: {len(g)} triples, {len(G)} nodes")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        render(p)
