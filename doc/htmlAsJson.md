This article describes how to format HTML in JSON.

What HTML has: elements, attributes

Each element is a plain object which just owns "one" property. The property name is the tag name of an element. The property value is also a Javascript object with two properties:

* a: attributes of an element. The proeprty value is an object containing all attributes of an element.
* c: children of an element. The property value should be an array if there is more than one child.

Here is an example:

    {
        t: "li",
        a: {
            value: 5
        },
        c: [
            "This is a ",
            {
                span: {
                    a: {
                        style: "color:blue"
                    },
                    c: "high-lighted"
                }
            },
            " item."
        ]
    }

which is the same as the following HTML code:

    <li value="5">
        This is a <span style="color:blue">high-lighted</span> item.
    </li>

This may seem even more cumbersome thant the original HTML format. However we can employee Javascript functions to make it more readable:

    html("li", ["This is a ", html("span", {style: "color:blue"}, "high-lighted"), " item."]);

or even better as:

    let highLight = html("span", {style: "color:blue"}, "high-lighted");
    html(["li", "This is a ", highLight, " item."]);

So what's the benefits of doing this? First of all, it lets us refactor HTML codes very easily. Secondly, We no longer have to mix HTML and Javascript using templates which sometimes can be cumbersome or even messy. Everything is in Javascript so no templates are required.