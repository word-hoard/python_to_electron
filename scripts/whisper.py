import cmd
from sys import stdout
from functools import wraps

def pyshell(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        stdout.write("new::msg\n")
        stdout.write(func(*args, **kwargs))
        stdout.write("\n")
        stdout.flush()
    return wrapper

class Cmd_interface(cmd.Cmd):

    prompt = ""

    @pyshell
    def do_hello(self, arg):
        return f"You said hello with the following arg: {arg}"
    
    @pyshell    
    def do_bye(self, arg):
        return "You said bye!"

    @pyshell
    def do_button(self, arg):
        return """<button onClick="Py.send('bye')"> press me to send 'bye' </button>"""

if __name__ == "__main__":
    Cmd_interface().cmdloop()