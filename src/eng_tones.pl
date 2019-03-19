# this file is used to generate eng_tones.json (without braces and escape)
use strict;
use warnings;
# http://svn.code.sf.net/p/cmusphinx/code/trunk/cmudict/cmudict-0.7b
my $filename = 'cmudict-0.7b';
if (open(my $fh, '<:encoding(UTF-8)', $filename)) {
while (my $row = <$fh>) {
  chomp $row;
  if ( $row =~ /^(\S+)  (.+)$/ ) {
    my $keyword = "\"$1\"";
    my $tones = $2;
    $tones =~ s/[^\d]//g;
    print "$keyword: \"$tones\",\n";
  }
}}
1;
